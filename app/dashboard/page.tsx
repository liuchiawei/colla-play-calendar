// CollaPlay 後台管理頁面（Server Component）
// 管理員權限檢查與 Client Component 包裝

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import DashboardClient from "./components/dashboard.client";

export default async function DashboardPage() {
  // 取得登入狀態
  const session = await auth.api.getSession({ headers: await headers() });

  // 若未登入，導向登入頁面
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  // 從資料庫獲取用戶的 isAdmin 狀態
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  // 若用戶不存在或不是管理員，導向首頁
  if (!user || !user.isAdmin) {
    redirect("/");
  }

  return <DashboardClient />;
}
