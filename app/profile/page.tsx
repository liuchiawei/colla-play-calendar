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

// 強制動態渲染，確保 OAuth 回調後能正確處理
export const dynamic = "force-dynamic";

// 異步資料獲取組件
async function ProfileContent() {
  // 取得登入狀態
  const session = await auth.api.getSession({ headers: await headers() });

  // 若未登入，導向登入頁面
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  // 注意：revalidateTag 不能在 Server Component 的 render 期間調用
  // 快取清除應該在 Route Handler 或 Server Action 中進行
  // OAuth 回調後，Better Auth 已經處理了會話，快取會在下次請求時自然更新
  // 如果需要立即清除快取，應該通過客戶端調用 /api/revalidate API
  // OAuth 回調後的快取清除由 OAuthCallbackHandler 客戶端組件處理

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
