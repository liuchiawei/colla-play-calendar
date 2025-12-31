"use client";

// 認證狀態提供者組件
// 在應用啟動時初始化 auth store，從 server 獲取用戶信息
import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";

export function AuthProvider() {
  const { fetchUser, initialized } = useAuthStore();

  useEffect(() => {
    // 如果尚未初始化，則獲取用戶信息
    if (!initialized) {
      fetchUser();
    }
  }, [fetchUser, initialized]);

  return null;
}

