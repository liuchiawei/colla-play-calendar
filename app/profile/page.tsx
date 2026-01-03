// 個人資料頁面
// 顯示與編輯使用者的個人資料資訊
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getProfile } from "@/lib/services/profile/profile.service";
import { ProfileTabs } from "./profile-tabs";
import SectionContainer from "@/components/layout/section-container";
import { ProfileFormSkeleton } from "@/components/features/user/profile-form-skeleton";

// 異步資料獲取組件
async function ProfileContent() {
  // 取得登入狀態
  const session = await auth.api.getSession({ headers: await headers() });

  // 若未登入，導向登入頁面
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  // 使用 profile service 取得個人資料（含快取）
  const profile = await getProfile(userId);

  return <ProfileTabs initialProfile={profile} />;
}

export default async function ProfilePage() {
  return (
    <SectionContainer>
      <Suspense fallback={<ProfileFormSkeleton />}>
        <ProfileContent />
      </Suspense>
    </SectionContainer>
  );
}
