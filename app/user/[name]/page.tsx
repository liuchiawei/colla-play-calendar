// 用戶個人資料頁面（動態路由）
// 顯示指定用戶的個人資料，根據訪問者身份顯示不同內容

import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getUserByName } from "@/lib/services/profile/profile.service";
import {
  getProfile,
  getPublicProfile,
} from "@/lib/services/profile/profile.service";
import ProfileForm from "@/components/features/user/profile-form";
import SectionContainer from "@/components/layout/section-container";
import { ProfileFormSkeleton } from "@/components/features/user/profile-form-skeleton";
import type { Profile, PublicProfileDto, UserWithAdmin } from "@/lib/types";

type PageProps = {
  params: Promise<{ name: string }>;
};

// 異步資料獲取組件
async function UserProfileContent({ name }: { name: string }) {
  // 解碼 URL 編碼的用戶名稱
  const decodedName = decodeURIComponent(name);

  // 1. 獲取當前會話（用於判斷是否是本人）
  const session = await auth.api.getSession({ headers: await headers() });
  const currentUserId = session?.user?.id || null;

  // 2. 根據 name 查找目標用戶（使用快取優化）
  const targetUser = await getUserByName(decodedName);

  // 3. 如果用戶不存在，返回 404
  if (!targetUser) {
    notFound();
  }

  const targetUserId = targetUser.id;

  // 4. 檢查是否是本人
  const isOwner = currentUserId === targetUserId;

  // 5. 根據是否為本人選擇獲取完整資料或公開資料
  let profile: Profile | PublicProfileDto | null = null;

  if (isOwner) {
    // 本人：獲取完整資料
    profile = await getProfile(targetUserId);
  } else {
    // 他人：獲取公開資料
    profile = await getPublicProfile(targetUserId);
  }

  // 6. 獲取目標用戶資訊（用於頭像顯示等）
  const targetUserInfo: UserWithAdmin | null = targetUser;

  return (
    <ProfileForm
      initialProfile={profile}
      isOwner={isOwner}
      targetUser={targetUserInfo}
    />
  );
}

export default async function UserProfilePage({ params }: PageProps) {
  const { name } = await params;

  return (
    <SectionContainer>
      <Suspense fallback={<ProfileFormSkeleton />}>
        <UserProfileContent name={name} />
      </Suspense>
    </SectionContainer>
  );
}
