"use client";

// 已報名使用者頭像堆疊載入骨架組件
// 使用 shadcn Skeleton 組件模擬頭像堆疊結構

import { Skeleton } from "@/components/ui/skeleton";

export function EventRegisteredUsersAvatarsSkeleton() {
  return (
    <div className="flex items-center -space-x-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton
          key={i}
          className="size-8 md:size-10 rounded-full border-2 border-background"
          style={{ zIndex: 5 - i }}
        />
      ))}
    </div>
  );
}

