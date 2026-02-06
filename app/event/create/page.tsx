// 創建活動頁面
// 獨立的創建活動頁面，檢查登入狀態

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import SectionContainer from "@/components/layout/section-container";
import { EventFormClient } from "./event-form-client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// 強制動態渲染
export const dynamic = "force-dynamic";

// 異步資料獲取組件
async function CreateEventContent() {
  // 取得登入狀態
  const session = await auth.api.getSession({ headers: await headers() });

  // 若未登入，導向登入頁面
  if (!session?.user) {
    redirect("/login");
  }

  // 獲取所有類別
  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return <EventFormClient categories={categories} />;
}

export default async function CreateEventPage() {
  return (
    <SectionContainer>
      <Suspense
        fallback={
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64 w-full" />
              </div>
            </CardContent>
          </Card>
        }
      >
        <CreateEventContent />
      </Suspense>
    </SectionContainer>
  );
}
