// Modern Admin Dashboard Layout (Server Component)
// 現代化管理後台佈局 - 管理員權限檢查與側邊欄包裝

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "./components/admin-sidebar.client";

export default async function DashboardNewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get session from better-auth
  const session = await auth.api.getSession({ headers: await headers() });

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  // Check admin status from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  // Redirect to home if not admin
  if (!user || !user.isAdmin) {
    redirect("/");
  }

  // Render layout with sidebar
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-background via-background to-accent/5 dark:from-background dark:via-background dark:to-accent/10">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </SidebarProvider>
  );
}
