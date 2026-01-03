/**
 * 認證服務 (Authentication Service)
 * 
 * 提供認證相關的業務邏輯處理，包括登入、註冊、登出、快取清除等功能
 * 遵循單一職責原則，將認證相關邏輯從組件中分離
 * 優化快取策略，減少不必要的網路請求和資料庫查詢
 */

import { authClient } from "@/lib/auth-client";
import type { UserWithAdmin } from "@/lib/types";

/**
 * 登出選項介面
 */
export interface SignOutOptions {
  /**
   * 登出後的回調函數，用於清除本地狀態（如 store）
   */
  onLogout?: () => void;
  /**
   * 登出後的導航回調函數
   */
  onNavigate?: (path: string) => void;
  /**
   * 路由刷新回調函數
   */
  onRefresh?: () => void;
  /**
   * 是否在錯誤時也執行清理操作（預設為 true）
   */
  cleanupOnError?: boolean;
}

/**
 * 登入選項介面
 */
export interface SignInOptions {
  /**
   * 登入成功後的回調函數，用於更新本地狀態（如 store）
   */
  onSuccess?: (user: UserWithAdmin | null) => void;
  /**
   * 登入後的導航回調函數
   */
  onNavigate?: (path: string) => void;
  /**
   * 路由刷新回調函數
   */
  onRefresh?: () => void;
  /**
   * 登入成功後導航的路徑（預設為 "/profile"）
   */
  redirectTo?: string;
}

/**
 * 註冊選項介面
 */
export interface SignUpOptions {
  /**
   * 註冊成功後的回調函數，用於更新本地狀態（如 store）
   */
  onSuccess?: (user: UserWithAdmin | null) => void;
  /**
   * 註冊後的導航回調函數
   */
  onNavigate?: (path: string) => void;
  /**
   * 路由刷新回調函數
   */
  onRefresh?: () => void;
  /**
   * 註冊成功後導航的路徑（預設為 "/profile"）
   */
  redirectTo?: string;
}

/**
 * 獲取用戶選項介面
 */
export interface FetchUserOptions {
  /**
   * 是否強制重新獲取（忽略快取），預設為 false
   */
  force?: boolean;
  /**
   * 成功後的回調函數
   */
  onSuccess?: (user: UserWithAdmin | null) => void;
}

/**
 * 清除快取
 * @param tags 要清除的快取標籤
 * @param userId 可選的用戶 ID，用於清除特定用戶的快取
 */
export async function revalidateCache(
  tags: string[] = ["user-auth"],
  userId?: string
): Promise<void> {
  try {
    await fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags, userId }),
      credentials: "include", // 確保包含 cookies
    });
  } catch (error) {
    // 快取清除失敗不應阻止流程，僅記錄錯誤
    console.error("Failed to revalidate cache:", error);
  }
}

/**
 * 獲取當前用戶信息（優化快取策略）
 * 
 * 使用快取策略減少不必要的網路請求：
 * - 使用 `force-cache` 配合 `revalidate` 時間（5 分鐘）
 * - 在登入/註冊成功後自動更新，避免額外的 fetchUser 調用
 * 
 * @param options 獲取選項
 * @returns Promise<UserWithAdmin | null>
 */
export async function fetchUser(
  options: FetchUserOptions = {}
): Promise<UserWithAdmin | null> {
  const { force = false, onSuccess } = options;

  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include", // 確保包含 cookies
      // 優化快取策略：使用 force-cache 配合 revalidate，減少不必要的請求
      cache: force ? "no-store" : "force-cache",
      next: force ? undefined : { revalidate: 300 }, // 5 分鐘快取
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.success && data.data) {
      onSuccess?.(data.data);
      return data.data;
    }

    // 未登入或獲取失敗
    onSuccess?.(null);
    return null;
  } catch (error) {
    console.error("[Auth Service] Failed to fetch user:", error);
    onSuccess?.(null);
    return null;
  }
}

/**
 * 執行登入操作
 * 
 * 此函數會依序執行：
 * 1. 執行認證客戶端登入
 * 2. 清除相關快取
 * 3. 獲取並更新用戶信息（透過 onSuccess 回調）
 * 4. 執行路由刷新和導航（透過回調函數）
 * 
 * @param email 電子郵件
 * @param password 密碼
 * @param options 登入選項
 * @returns Promise<{ success: boolean; error?: string; user?: UserWithAdmin | null }>
 * 
 * @example
 * ```ts
 * const result = await signIn(email, password, {
 *   onSuccess: (user) => setUser(user),
 *   onNavigate: (path) => router.push(path),
 *   onRefresh: () => router.refresh(),
 * });
 * ```
 */
export async function signIn(
  email: string,
  password: string,
  options: SignInOptions = {}
): Promise<{ success: boolean; error?: string; user?: UserWithAdmin | null }> {
  const {
    onSuccess,
    onNavigate,
    onRefresh,
    redirectTo = "/profile",
  } = options;

  try {
    // 1. 執行認證客戶端登入
    const result = await authClient.signIn.email({
      email,
      password,
    });

    if (result.error) {
      return {
        success: false,
        error: result.error.message || "登入失敗",
      };
    }

    // 2. 清除用戶認證快取
    await revalidateCache(["user-auth"]);

    // 3. 獲取並更新用戶信息（使用強制重新獲取，確保獲取最新數據）
    const user = await fetchUser({ force: true, onSuccess });

    // 4. 執行路由刷新
    onRefresh?.();

    // 5. 導航到指定頁面
    onNavigate?.(redirectTo);

    return {
      success: true,
      user,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "登入失敗，請再試一次";
    console.error("[Auth Service] Sign in error:", error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * 執行註冊操作
 * 
 * 此函數會依序執行：
 * 1. 執行認證客戶端註冊
 * 2. 清除相關快取
 * 3. 獲取並更新用戶信息（透過 onSuccess 回調）
 * 4. 執行路由刷新和導航（透過回調函數）
 * 
 * @param email 電子郵件
 * @param password 密碼
 * @param name 名稱（可選，預設使用 email 的本地部分）
 * @param options 註冊選項
 * @returns Promise<{ success: boolean; error?: string; user?: UserWithAdmin | null }>
 * 
 * @example
 * ```ts
 * const result = await signUp(email, password, name, {
 *   onSuccess: (user) => setUser(user),
 *   onNavigate: (path) => router.push(path),
 *   onRefresh: () => router.refresh(),
 * });
 * ```
 */
export async function signUp(
  email: string,
  password: string,
  name?: string,
  options: SignUpOptions = {}
): Promise<{ success: boolean; error?: string; user?: UserWithAdmin | null }> {
  const {
    onSuccess,
    onNavigate,
    onRefresh,
    redirectTo = "/profile",
  } = options;

  try {
    // 使用 email 的本地部分作為預設名稱
    const userName = name || email.split("@")[0] || "";

    // 1. 執行認證客戶端註冊
    const result = await authClient.signUp.email({
      email,
      password,
      name: userName,
    });

    if (result.error) {
      return {
        success: false,
        error: result.error.message || "註冊失敗",
      };
    }

    // 2. 清除用戶認證快取
    await revalidateCache(["user-auth"]);

    // 3. 獲取並更新用戶信息（使用強制重新獲取，確保獲取最新數據）
    const user = await fetchUser({ force: true, onSuccess });

    // 4. 執行路由刷新
    onRefresh?.();

    // 5. 導航到指定頁面
    onNavigate?.(redirectTo);

    return {
      success: true,
      user,
    };
  } catch (error) {
    // 處理特定錯誤類型
    let errorMessage = "註冊失敗，請再試一次";

    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();

      // SSL/Mixed Content 錯誤
      if (
        errorMsg.includes("ssl") ||
        errorMsg.includes("mixed content") ||
        errorMsg.includes("https://localhost") ||
        errorMsg.includes("protocol")
      ) {
        errorMessage =
          "連線錯誤：請檢查 baseURL 設定。若在開發環境，請確認使用 http://localhost:3000 而非 https://localhost:3000";
      }
      // Invalid URL 錯誤
      else if (
        errorMsg.includes("invalid url") ||
        errorMsg.includes("failed to parse") ||
        errorMsg.includes("malformed")
      ) {
        errorMessage =
          "URL 格式錯誤：請檢查環境變數 NEXT_PUBLIC_APP_URL 是否為合法格式（不可包含雙協定，例如 http://https://...）";
      }
      // 網路錯誤
      else if (
        errorMsg.includes("network") ||
        errorMsg.includes("fetch") ||
        errorMsg.includes("cors")
      ) {
        const baseURL = process.env.NEXT_PUBLIC_APP_URL || "未設定";
        errorMessage = `網路連線失敗：請檢查瀏覽器 DevTools Network 標籤。\n預期端點：/api/auth/sign-up/email\nNEXT_PUBLIC_APP_URL: ${baseURL}`;
      } else {
        errorMessage = error.message || errorMessage;
      }
    }

    console.error("[Auth Service] Sign up error:", error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * 執行登出操作
 * 
 * 此函數會依序執行：
 * 1. 清除相關快取
 * 2. 執行認證客戶端登出
 * 3. 清除本地狀態（透過 onLogout 回調）
 * 4. 執行路由刷新和導航（透過回調函數）
 * 
 * @param options 登出選項
 * @returns Promise<void>
 * 
 * @example
 * ```ts
 * await signOut({
 *   onLogout: () => logout(),
 *   onNavigate: (path) => router.push(path),
 *   onRefresh: () => router.refresh(),
 * });
 * ```
 */
export async function signOut(
  options: SignOutOptions = {}
): Promise<void> {
  const {
    onLogout,
    onNavigate,
    onRefresh,
    cleanupOnError = true,
  } = options;

  try {
    // 1. 清除快取（失敗不應阻止登出流程）
    await revalidateCache(["user-auth"]);

    // 2. 執行認證客戶端登出
    await authClient.signOut();

    // 3. 清除本地狀態
    onLogout?.();

    // 4. 執行路由刷新
    onRefresh?.();

    // 5. 導航到登入頁面
    onNavigate?.("/login");
  } catch (error) {
    console.error("Sign out error:", error);

    // 即使出錯也執行清理操作（如果啟用）
    if (cleanupOnError) {
      onLogout?.();
      onNavigate?.("/login");
    }

    // 重新拋出錯誤，讓調用者可以處理
    throw error;
  }
}

