"use client";

// 活動已報名使用者頭像堆疊組件
// 顯示已報名使用者的頭像堆疊列表，使用 shadcn 組件

import { useEffect, useState } from "react";
import UserAvatar from "@/components/features/user/user-avatar";
import { EventRegisteredUsersAvatarsSkeleton } from "./event-registered-users-avatars-skeleton";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { UserWithAdmin } from "@/lib/types";

interface RegisteredUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface EventRegisteredUsersAvatarsProps {
  eventId: string;
  className?: string;
  maxDisplay?: number; // 最多顯示的頭像數量
}

export function EventRegisteredUsersAvatars({
  eventId,
  className,
  maxDisplay = 8,
}: EventRegisteredUsersAvatarsProps) {
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRegisteredUsers() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/events/${eventId}/registered-users`);

        if (!response.ok) {
          throw new Error("取得報名使用者列表失敗");
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "取得報名使用者列表失敗");
        }

        setUsers(result.data.users || []);
        setTotal(result.data.total || 0);
      } catch (err) {
        console.error("Failed to fetch registered users:", err);
        setError(err instanceof Error ? err.message : "載入失敗");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRegisteredUsers();
  }, [eventId]);

  // 載入中顯示 skeleton
  if (isLoading) {
    return <EventRegisteredUsersAvatarsSkeleton />;
  }

  // 錯誤或無使用者時不顯示
  if (error || users.length === 0) {
    return null;
  }

  // 計算要顯示的使用者和剩餘數量
  const displayUsers = users.slice(0, maxDisplay);
  // 只計算登入使用者的剩餘數量（因為匿名使用者不會顯示頭像）
  const remainingCount = Math.max(0, users.length - maxDisplay);

  // 取得 fallback 文字（使用者名稱的首字母）
  const getFallbackText = (user: RegisteredUser) => {
    if (user.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return "?";
  };

  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {displayUsers.map((user) => (
        <UserAvatar
          key={user.id}
          user={user}
          className="size-6 xl:size-8"
        />
      ))}

      {/* 顯示剩餘數量 */}
      {remainingCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative cursor-pointer" style={{ zIndex: 0 }}>
              <Avatar className="size-6 xl:size-8 border-2 border-background bg-muted hover:scale-110 transition-transform">
                <AvatarFallback className="text-xs font-semibold">
                  +{remainingCount}
                </AvatarFallback>
              </Avatar>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <div className="text-xs">還有 {remainingCount} 位已報名使用者</div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
