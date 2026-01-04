"use client";

// ユーザープロフィール Hover Card コンポーネント
// ユーザーの基本情報と公開プロフィール情報を表示する hover card

import * as React from "react";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  UserWithAdmin,
  PublicProfileDto,
  ApiResponse,
  RegisteredUser,
} from "@/lib/types";

// ユーザー基本情報の最小要件型（Hover Card で使用）
type UserBasicInfo = Pick<UserWithAdmin, "id" | "name" | "email" | "image">;

interface UserProfileHoverCardProps {
  // ユーザー基本情報（UserWithAdmin または RegisteredUser）
  user: UserWithAdmin | RegisteredUser | UserBasicInfo;
  // カスタムコンテンツ（拡張用）
  children?: React.ReactNode;
  // Footer レンダリング関数（拡張用）
  renderFooter?: (profile: PublicProfileDto | null) => React.ReactNode;
  // Hover card の開閉遅延時間（ms）
  openDelay?: number;
  // Hover card の閉じる遅延時間（ms）
  closeDelay?: number;
}

// プロフィール情報を取得するカスタムフック
function usePublicProfile(userId: string) {
  const [profile, setProfile] = React.useState<PublicProfileDto | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasFetched, setHasFetched] = React.useState(false);

  const fetchProfile = React.useCallback(async () => {
    // 既に取得済みの場合は再取得しない（簡単なキャッシュ）
    if (hasFetched) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/profiles/${userId}`);
      const data: ApiResponse<PublicProfileDto> = await response.json();

      if (data.success && data.data) {
        setProfile(data.data);
      } else {
        // プロフィールが存在しない、または非公開の場合はエラーとして扱わない
        // これは正常な状態として扱う
        setProfile(null);
        if (data.error && response.status !== 403 && response.status !== 404) {
          setError(data.error);
        }
      }
    } catch (err) {
      console.error("[UserProfileHoverCard] Failed to fetch profile:", err);
      setError("プロフィールの取得に失敗しました");
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  }, [userId, hasFetched]);

  return { profile, isLoading, error, fetchProfile };
}

// プロフィール情報に公開フィールドがあるかチェック
function hasPublicProfileFields(profile: PublicProfileDto | null): boolean {
  if (!profile) return false;
  return !!(
    profile.displayName ||
    profile.occupation ||
    profile.education ||
    profile.skills ||
    profile.bio
  );
}

// プロフィール情報表示コンポーネント
function ProfileInfoSection({
  profile,
  isLoading,
}: {
  profile: PublicProfileDto | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  // 公開されているフィールドがあるかチェック
  if (!hasPublicProfileFields(profile)) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Display Name */}
      {profile.displayName && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">
            顯示名稱
          </div>
          <div className="text-sm font-medium">{profile.displayName}</div>
        </div>
      )}

      {/* Occupation */}
      {profile.occupation && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">
            職業
          </div>
          <div className="text-sm">{profile.occupation}</div>
        </div>
      )}

      {/* Education */}
      {profile.education && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">
            學歷
          </div>
          <div className="text-sm">{profile.education}</div>
        </div>
      )}

      {/* Skills */}
      {profile.skills && profile.skills.length > 0 && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">
            技能
          </div>
          <div className="flex flex-wrap gap-1">
            {profile.skills.map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Bio */}
      {profile.bio && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">
            簡介
          </div>
          <div className="text-sm text-muted-foreground line-clamp-3">
            {profile.bio}
          </div>
        </div>
      )}
    </div>
  );
}

export function UserProfileHoverCard({
  user,
  children,
  renderFooter,
  openDelay = 300,
  closeDelay = 100,
}: UserProfileHoverCardProps) {
  const { profile, isLoading, error, fetchProfile } = usePublicProfile(user.id);
  const [isOpen, setIsOpen] = React.useState(false);

  // Hover card が開いた時にプロフィール情報を取得
  React.useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen, fetchProfile]);

  const displayName =
    user.name ||
    ("email" in user && user.email ? user.email.split("@")[0] : null) ||
    "使用者";
  const fallbackText =
    user.name?.charAt(0) ||
    ("email" in user && user.email ? user.email.charAt(0) : null) ||
    "?";

  return (
    <HoverCard
      openDelay={openDelay}
      closeDelay={closeDelay}
      onOpenChange={setIsOpen}
    >
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-80" align="start">
        <div className="space-y-4">
          {/* ヘッダー：ユーザー基本情報 */}
          <div className="flex items-start gap-3">
            <Avatar className="size-12">
              <AvatarImage
                src={user.image || undefined}
                alt={displayName}
                loading="lazy"
              />
              <AvatarFallback className="text-sm font-semibold bg-muted">
                {fallbackText}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="font-semibold text-sm truncate">
                {displayName}
              </div>
              {"email" in user && user.email && (
                <div className="text-xs text-muted-foreground truncate">
                  {user.email}
                </div>
              )}
            </div>
          </div>

          {/* プロフィール情報セクション */}
          {(isLoading || hasPublicProfileFields(profile)) && (
            <>
              <Separator />
              <ProfileInfoSection profile={profile} isLoading={isLoading} />
            </>
          )}

          {/* カスタム Footer（拡張用） */}
          {renderFooter && (
            <>
              <Separator />
              {renderFooter(profile)}
            </>
          )}

          {/* エラー表示（デバッグ用、本番環境では非表示推奨） */}
          {error && process.env.NODE_ENV === "development" && (
            <div className="text-xs text-destructive">{error}</div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
