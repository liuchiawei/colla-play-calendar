// 認證狀態管理 Store（使用 Zustand）
// 管理用戶登入狀態、管理員權限等全局狀態
// 使用優化的快取策略減少不必要的網路請求
import { create } from "zustand";
import { fetchUser } from "@/lib/services/auth/auth.service";
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

  // 從 API 獲取當前用戶信息（使用優化的快取策略）
  fetchUser: async () => {
    set({ isLoading: true });
    try {
      // 使用統一的認證服務獲取用戶信息（已包含快取邏輯）
      const user = await fetchUser({
        force: false, // 使用快取，減少不必要的請求
        onSuccess: (userData) => {
          if (userData) {
            set({
              user: userData,
              isAdmin: userData.isAdmin,
              isLoading: false,
              initialized: true,
            });

            // 調試信息（僅在開發環境）
            if (process.env.NODE_ENV === "development") {
              console.log("[Auth Store] User set:", userData.email);
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
              console.log("[Auth Store] No user found");
            }
          }
        },
      });

      // 如果 onSuccess 未觸發（例如快取命中），手動更新狀態
      if (user !== undefined) {
        if (user) {
          set({
            user,
            isAdmin: user.isAdmin,
            isLoading: false,
            initialized: true,
          });
        } else {
          set({
            user: null,
            isAdmin: false,
            isLoading: false,
            initialized: true,
          });
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

