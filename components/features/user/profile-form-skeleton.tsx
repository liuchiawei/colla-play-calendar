"use client";

// 個人資料表單載入骨架組件
// 使用 shadcn Skeleton 組件模擬個人資料表單結構

import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function ProfileFormSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div>
              <Skeleton className="h-6 w-32" />
            </div>
            <div>
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-16" /> {/* 編輯按鈕 */}
            <Skeleton className="h-10 w-16" /> {/* 登出按鈕 */}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 頭像上傳區塊骨架 */}
        <div className="mb-6 flex justify-center">
          <Skeleton className="size-32 rounded-full" />
        </div>

        {/* 字段列表骨架 */}
        <div className="space-y-4">
          {/* 姓名 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" /> {/* 標籤 */}
              <Skeleton className="h-4 w-4 rounded-full" /> {/* 可見性圖標 */}
            </div>
            <Skeleton className="h-6 w-3/4" /> {/* 值 */}
          </div>
          <Separator />

          {/* 生日 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="h-6 w-1/2" />
          </div>
          <Separator />

          {/* 性別 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
          <Separator />

          {/* 職業 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="h-6 w-2/3" />
          </div>
          <Separator />

          {/* 學歷 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="h-6 w-1/2" />
          </div>
          <Separator />

          {/* 技能 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="h-6 w-full" />
          </div>
          <Separator />

          {/* 簡介 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

