/**
 * 服務端認證服務 (Server-side Authentication Service)
 *
 * 提供服務端認證相關的業務邏輯處理，包括會話獲取、用戶信息查詢、權限檢查等
 * 使用 Next.js unstable_cache 優化性能，減少資料庫查詢
 * 遵循單一職責原則，統一管理服務端認證邏輯
 */

import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { ApiResponse, UserWithAdmin } from "@/lib/types";

/**
 * 會話信息
 */
export interface SessionInfo {
  session: Awaited<ReturnType<typeof auth.api.getSession>>;
  userId: string | null;
  isAuthenticated: boolean;
}

/**
 * 用戶信息（包含管理員狀態）
 */
export interface UserInfo {
  user: UserWithAdmin | null;
  isAdmin: boolean;
  userId: string | null;
}

/**
 * 獲取會話（帶錯誤處理）
 * 
 * 注意：better-auth 的 getSession 每次都會查詢資料庫驗證 session。
 * 為減少查詢次數，建議：
 * 1. 調整客戶端 SWR 的 staleTime，減少 API 重新驗證頻率
 * 2. 在同一個請求處理中，盡可能只調用一次 getSession
 *
 * @param request Next.js 請求對象
 * @returns Promise<SessionInfo>
 */
export async function getSession(request: NextRequest): Promise<SessionInfo> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return {
        session: null,
        userId: null,
        isAuthenticated: false,
      };
    }

    return {
      session,
      userId: session.user.id || null,
      isAuthenticated: true,
    };
  } catch (error) {
    console.error("[Auth Server Service] Failed to get session:", error);
    return {
      session: null,
      userId: null,
      isAuthenticated: false,
    };
  }
}

/**
 * 從資料庫獲取用戶信息（內部函數，用於快取）
 *
 * @param userId 用戶 ID
 * @returns Promise<UserWithAdmin | null>
 */
async function fetchUserFromDb(userId: string): Promise<UserWithAdmin | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user as UserWithAdmin | null;
  } catch (error) {
    console.error("[Auth Server Service] Failed to fetch user from DB:", error);
    return null;
  }
}

/**
 * 獲取當前用戶信息（帶快取）
 *
 * 使用 Next.js unstable_cache 快取用戶查詢結果：
 * - 快取 key: `user-${userId}`
 * - 快取 tag: `user-${userId}`, `user-auth`
 * - TTL: 5 分鐘
 *
 * @param userId 用戶 ID
 * @returns Promise<UserWithAdmin | null>
 */
export async function getCurrentUser(
  userId: string
): Promise<UserWithAdmin | null> {
  if (!userId) {
    return null;
  }

  try {
    // 使用 unstable_cache 快取用戶查詢
    const cachedUser = await unstable_cache(
      async () => fetchUserFromDb(userId),
      [`user-${userId}`], // 快取 key
      {
        tags: [`user-${userId}`, "user-auth"], // 快取標籤
        revalidate: 300, // 5 分鐘 TTL
      }
    )();

    return cachedUser;
  } catch (error) {
    console.error("[Auth Server Service] Failed to get current user:", error);
    return null;
  }
}

/**
 * 檢查管理員權限（帶快取）
 *
 * 使用快取避免同一請求中多次查詢資料庫
 *
 * @param request Next.js 請求對象
 * @returns Promise<UserInfo>
 */
export async function checkAdmin(request: NextRequest): Promise<UserInfo> {
  const sessionInfo = await getSession(request);

  if (!sessionInfo.isAuthenticated || !sessionInfo.userId) {
    return {
      user: null,
      isAdmin: false,
      userId: null,
    };
  }

  // 使用快取的 getCurrentUser 獲取用戶信息
  const user = await getCurrentUser(sessionInfo.userId);

  return {
    user,
    isAdmin: user?.isAdmin ?? false,
    userId: sessionInfo.userId,
  };
}

/**
 * 要求認證的中間件函數
 *
 * 如果用戶未登入，返回 401 錯誤
 *
 * @param request Next.js 請求對象
 * @returns Promise<{ userId: string } | NextResponse>
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ userId: string } | NextResponse> {
  const sessionInfo = await getSession(request);

  if (!sessionInfo.isAuthenticated || !sessionInfo.userId) {
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "需要登入",
      },
      { status: 401 }
    );
  }

  return { userId: sessionInfo.userId };
}

/**
 * 要求管理員權限的中間件函數
 *
 * 如果用戶未登入或不是管理員，返回相應錯誤
 *
 * @param request Next.js 請求對象
 * @returns Promise<{ userId: string; user: UserWithAdmin } | NextResponse>
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ userId: string; user: UserWithAdmin } | NextResponse> {
  const authResult = await requireAuth(request);

  // 如果 requireAuth 返回 NextResponse，表示未登入
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { userId } = authResult;

  // 檢查管理員權限（使用快取）
  const userInfo = await checkAdmin(request);

  if (!userInfo.isAdmin || !userInfo.user) {
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "需要管理員權限",
      },
      { status: 403 }
    );
  }

  return {
    userId,
    user: userInfo.user,
  };
}

/**
 * 清除用戶快取
 *
 * 用於在用戶信息更新時清除相關快取
 *
 * @param userId 用戶 ID
 */
export async function clearUserCache(userId: string): Promise<void> {
  // 注意：unstable_cache 的清除需要透過 revalidateTag
  // 這裡僅提供函數簽名，實際清除需要在 API 路由中使用 revalidateTag
  // 此函數主要用於文檔說明和類型檢查
  if (process.env.NODE_ENV === "development") {
    console.log(`[Auth Server Service] Should clear cache for user: ${userId}`);
  }
}
