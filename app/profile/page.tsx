// 個人資料頁面
// 顯示與編輯使用者的個人資料資訊
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ProfileTabs } from "./profile-tabs";

export default async function ProfilePage() {
  // 取得登入狀態
  const session = await auth.api.getSession({ headers: await headers() });

  // 若未登入，導向登入頁面
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  // 取得個人資料（不存在則為 null）
  const profile = await prisma.profile.findUnique({
    where: { userId },
  });

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <ProfileTabs initialProfile={profile} />
    </div>
  );
}
