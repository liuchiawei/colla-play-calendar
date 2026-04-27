// 成員管理頁 (dashboard-new/users)
// RSC：僅渲染 client 內容，資料由 SWR 在 client 取得

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { UsersContent } from "./users-content.client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  buildLoginUrlWithNext,
  buildPathWithSearch,
  type NextSearchParams,
} from "@/lib/utils/login-next";

interface PageProps {
  searchParams?: Promise<NextSearchParams>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  const sp = searchParams ? await searchParams : undefined;
  const nextPath = buildPathWithSearch("/dashboard-new/users", sp);

  if (!session?.user) {
    redirect(buildLoginUrlWithNext(nextPath));
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });
  if (!user?.isAdmin) {
    redirect("/");
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <UsersContent />
    </div>
  );
}
