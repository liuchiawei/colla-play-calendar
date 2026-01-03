/**
 * Profile 相關的 SWR Hooks
 * 
 * 提供個人資料和活動紀錄的數據獲取與快取管理
 * 使用 SWR 實現智能快取、自動重新驗證和錯誤處理
 */

import useSWR from "swr";
import type { Profile, EventWithCategory } from "@/lib/types";
import type { ApiResponse } from "@/lib/types";
import type { UserEventsResponse } from "@/app/api/profile/events/route";

// SWR Fetcher 函數
const fetcher = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const result: ApiResponse<T> = await response.json();

  if (!result.success) {
    throw new Error(result.error || "請求失敗");
  }

  return result.data as T;
};

/**
 * 取得個人資料的 Hook
 * 
 * @param options SWR 配置選項
 * @returns SWR 響應對象
 */
export function useProfile(options?: { fallbackData?: Profile | null }) {
  return useSWR<Profile | null>(
    "/api/profile",
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      staleTime: 5 * 60 * 1000, // 5 分鐘
      fallbackData: options?.fallbackData,
      onError: (error) => {
        console.error("[useProfile] Failed to fetch profile:", error);
      },
    }
  );
}

/**
 * 取得使用者活動紀錄的 Hook
 * 
 * @param options SWR 配置選項
 * @returns SWR 響應對象
 */
export function useProfileEvents(options?: { fallbackData?: EventWithCategory[] }) {
  return useSWR<EventWithCategory[]>(
    "/api/profile/events",
    (url) => fetcher<UserEventsResponse>(url).then((data) => data.events || []),
    {
      revalidateOnFocus: false, // 關閉視窗聚焦重新驗證，減少不必要的 API 調用
      revalidateOnReconnect: true, // 保持網路重連時重新驗證
      dedupingInterval: 5000, // 增加為 5 秒，避免短時間內重複請求
      staleTime: 5 * 60 * 1000, // 增加為 5 分鐘，減少不必要的資料庫查詢
      // 使用 keepPreviousData 保持舊資料顯示，直到新資料載入完成
      keepPreviousData: true,
      fallbackData: options?.fallbackData,
      onError: (error) => {
        console.error("[useProfileEvents] Failed to fetch events:", error);
      },
    }
  );
}

