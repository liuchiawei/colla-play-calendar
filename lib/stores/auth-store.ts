// 認證狀態管理 Store（使用 Zustand）
// 管理用戶登入狀態、管理員權限等全局狀態
import { create } from "zustand";
import type { UserWithAdmin } from "@/lib/types";

interface AuthState {
  // 用戶信息
  user: UserWithAdmin | null;
  // 是否為管理員
  isAdmin: boolean;
  // 載入狀態
  isLoading: boolean;
  // 是否已初始化
  initialized: boolean;
  // 獲取用戶信息
  fetchUser: () => Promise<void>;
  // 設置用戶信息
  setUser: (user: UserWithAdmin | null) => void;
  // 登出
  logout: () => void;
  // 初始化（從 server 同步狀態）
  initialize: (user: UserWithAdmin | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAdmin: false,
  isLoading: false,
  initialized: false,

  // 從 API 獲取當前用戶信息
  fetchUser: async () => {
    set({ isLoading: true });
    try {
      // 確保 fetch 請求包含 credentials（cookies）
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include", // 確保包含 cookies
        cache: "no-store", // 禁用快取
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      // 調試信息（僅在開發環境）
      if (process.env.NODE_ENV === "development") {
        console.log("[Auth Store] fetchUser response:", {
          success: data.success,
          hasData: !!data.data,
          status: response.status,
        });
      }

      if (data.success && data.data) {
        set({
          user: data.data,
          isAdmin: data.data.isAdmin,
          isLoading: false,
          initialized: true,
        });
        
        // 調試信息
        if (process.env.NODE_ENV === "development") {
          console.log("[Auth Store] User set:", data.data.email);
        }
      } else {
        // 未登入或獲取失敗
        set({
          user: null,
          isAdmin: false,
          isLoading: false,
          initialized: true,
        });
        
        // 調試信息
        if (process.env.NODE_ENV === "development") {
          console.log("[Auth Store] No user found, error:", data.error);
        }
      }
    } catch (error) {
      console.error("[Auth Store] Failed to fetch user:", error);
      set({
        user: null,
        isAdmin: false,
        isLoading: false,
        initialized: true,
      });
    }
  },

  // 設置用戶信息
  setUser: (user: UserWithAdmin | null) => {
    set({
      user,
      isAdmin: user?.isAdmin ?? false,
    });
  },

  // 登出
  logout: () => {
    set({
      user: null,
      isAdmin: false,
      initialized: true,
    });
  },

  // 從 server 初始化（用於 SSR）
  initialize: (user: UserWithAdmin | null) => {
    set({
      user,
      isAdmin: user?.isAdmin ?? false,
      initialized: true,
    });
  },
}));

