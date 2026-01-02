"use client";

// 活動標籤頁載入骨架組件
// 使用 shadcn Skeleton 組件模擬活動列表結構

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function EventsTabSkeleton() {
  return (
    <div className="space-y-6">
      {/* 已參加的活動區塊骨架 */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" /> {/* 區塊標題 */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" /> {/* 活動標題 */}
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-24" /> {/* 日期 */}
                      <Skeleton className="h-4 w-20" /> {/* 時間 */}
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />{" "}
                  {/* 類別標籤 */}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" /> {/* 地點 */}
                  <Skeleton className="h-4 w-2/3" /> {/* 主辦單位 */}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 已報名的未來活動區塊骨架 */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" /> {/* 區塊標題 */}
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" /> {/* 活動標題 */}
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-24" /> {/* 日期 */}
                      <Skeleton className="h-4 w-20" /> {/* 時間 */}
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />{" "}
                  {/* 類別標籤 */}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" /> {/* 地點 */}
                  <Skeleton className="h-4 w-2/3" /> {/* 主辦單位 */}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
