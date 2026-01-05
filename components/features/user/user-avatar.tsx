"use client";

// ユーザーアバターコンポーネント（Hover Card 統合版）
// ユーザーのアバターを表示し、ホバー時にプロフィール情報を表示

import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { RegisteredUser, UserWithAdmin } from "@/lib/types";
import { UserProfileHoverCard } from "./user-profile-hover-card";

interface UserAvatarProps {
  user: RegisteredUser | UserWithAdmin;
  // Hover card を無効化するオプション
  disableHover?: boolean;
  // Hover card の開閉遅延時間
  hoverOpenDelay?: number;
  hoverCloseDelay?: number;
}

export default function UserAvatar({
  user,
  disableHover = false,
  hoverOpenDelay,
  hoverCloseDelay,
}: UserAvatarProps) {
  const avatarContent = (
    <Link href={`/user/${user.id}`} className="inline-block">
      <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
        <AvatarImage
          src={user.image || undefined}
          alt={user.name || `使用者 ${user.id}`}
          loading="lazy"
        />
        <AvatarFallback className="text-xs font-semibold bg-muted">
          {user.name?.charAt(0) || user.email?.charAt(0) || "?"}
        </AvatarFallback>
      </Avatar>
    </Link>
  );

  // Hover card が無効化されている場合は通常のアバターのみを返す
  if (disableHover) {
    return avatarContent;
  }

  // Hover card を統合
  return (
    <UserProfileHoverCard
      user={user}
      openDelay={hoverOpenDelay}
      closeDelay={hoverCloseDelay}
    >
      {avatarContent}
    </UserProfileHoverCard>
  );
}
