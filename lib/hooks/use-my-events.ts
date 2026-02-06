/**
 * 我的活動 Hook
 * 使用 SWR 獲取用戶創建的事件列表
 */

import useSWR from "swr";
import type { EventWithCategory } from "@/lib/types";
import type { ApiResponse } from "@/lib/types";

const fetcher = async (url: string): Promise<EventWithCategory[]> => {
  const response = await fetch(url);
  const data: ApiResponse<EventWithCategory[]> = await response.json();

  if (!response.ok || !data.success) {
    const error = new Error(data.error || "獲取活動列表失敗");
    throw error;
  }

  return data.data || [];
};

/**
 * 獲取當前用戶創建的所有活動
 */
export function useMyEvents() {
  const { data, error, isLoading, mutate } = useSWR<EventWithCategory[]>(
    "/api/events/my-events",
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // 5 秒內去重
    }
  );

  return {
    data: data || [],
    isLoading,
    error,
    mutate, // 手動重新驗證
  };
}
