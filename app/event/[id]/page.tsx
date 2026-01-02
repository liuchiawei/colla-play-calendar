// CollaPlay 活動詳細頁面 - Server Component
// 顯示單一活動的完整資訊，包含報名功能

import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getAnonymousSessionId } from "@/lib/utils/registration";
import type { EventWithCategory } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/date-utils";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Tag,
  ExternalLink,
  Ticket,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EventRegistrationButton } from "@/components/features/events/event-registration-button";
import { EventRegisteredUsersAvatars } from "@/components/features/events/event-registered-users-avatars";
import { Suspense } from "react";
import { EventRegisteredUsersAvatarsSkeleton } from "@/components/features/events/event-registered-users-avatars-skeleton";

type PageProps = {
  params: Promise<{ id: string }>;
};

// 動態生成 Metadata
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        title: true,
        description: true,
        imageUrl: true,
        imageBlobUrl: true,
      },
    });

    if (!event) {
      return {
        title: "活動不存在 | CollaPlay",
      };
    }

    const title = `${event.title} | CollaPlay`;
    const description =
      event.description || `探索 CollaPlay 的精彩活動：${event.title}`;
    const imageUrl = event.imageBlobUrl || event.imageUrl;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        ...(imageUrl && { images: [imageUrl] }),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        ...(imageUrl && { images: [imageUrl] }),
      },
    };
  } catch (error) {
    console.error("Failed to generate metadata:", error);
    return {
      title: "活動詳情 | CollaPlay",
    };
  }
}

// 主頁面組件
export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;

  try {
    // 取得當前用戶 ID（如果已登入）
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id || null;

    // 取得匿名 session ID（如果未登入）
    let anonymousSessionId: string | undefined;
    if (!userId) {
      anonymousSessionId = await getAnonymousSessionId();
    }

    // 查詢活動資料
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        category: true,
        _count: {
          select: { registrations: true },
        },
        registrations: {
          where: {
            OR: [
              userId ? { userId } : { id: "" },
              anonymousSessionId ? { anonymousSessionId } : { id: "" },
            ],
          },
          select: { id: true },
        },
      },
    });

    // 如果活動不存在，顯示 404
    if (!event) {
      notFound();
    }

    // 轉換為前端格式
    const { registrations, _count, ...eventData } = event;
    const eventWithCount: EventWithCategory = {
      ...eventData,
      registrationCount: _count.registrations,
      isRegistered: registrations.length > 0,
    };

    const categoryColor = eventWithCount.category?.color || "#6366f1";

    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* 主內容 */}
        <main className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
          {/* 圖片區塊 */}
          <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden mb-6 shadow-lg">
            {eventWithCount.imageBlobUrl || eventWithCount.imageUrl ? (
              <img
                src={
                  eventWithCount.imageBlobUrl || eventWithCount.imageUrl || ""
                }
                alt={eventWithCount.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  background: `linear-gradient(135deg, ${categoryColor}cc 0%, ${categoryColor}66 100%)`,
                }}
              />
            )}
            {/* 疊加層 */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

            {/* 類別標籤 */}
            {eventWithCount.category && (
              <div className="absolute top-4 left-4">
                <Badge
                  style={{ backgroundColor: categoryColor }}
                  className="text-white border-0"
                >
                  {eventWithCount.category.name}
                </Badge>
              </div>
            )}
          </div>

          {/* 內容區塊 */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-xl p-6 md:p-8">
            {/* 標題 */}
            <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-6 font-[var(--font-outfit)]">
              {eventWithCount.title}
            </h1>

            {/* 活動基本資料 */}
            <div className="space-y-4">
              {/* 日時資訊 */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary flex-shrink-0">
                  <Calendar className="size-5" />
                </div>
                <div>
                  <div className="text-base font-medium text-foreground">
                    {formatDate(eventWithCount.startTime)}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(eventWithCount.startTime)} -{" "}
                    {formatTime(eventWithCount.endTime)}
                  </div>
                </div>
              </div>

              {/* 地點 */}
              {eventWithCount.location && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10 text-primary flex-shrink-0">
                    <MapPin className="size-5" />
                  </div>
                  <div className="text-base text-foreground">
                    {eventWithCount.location}
                  </div>
                </div>
              )}

              {/* 主辦者 */}
              {eventWithCount.organizer && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10 text-primary flex-shrink-0">
                    <User className="size-5" />
                  </div>
                  <div className="text-base text-foreground">
                    {eventWithCount.organizer}
                  </div>
                </div>
              )}

              {/* 價格 */}
              {eventWithCount.price && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10 text-primary flex-shrink-0">
                    <Ticket className="size-5" />
                  </div>
                  <div className="text-base text-foreground">
                    {eventWithCount.price}
                  </div>
                </div>
              )}

              {/* 報名網址 */}
              {eventWithCount.registrationUrl && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10 text-primary flex-shrink-0">
                    <ExternalLink className="size-5" />
                  </div>
                  <div className="text-base text-foreground">
                    <a
                      href={eventWithCount.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline break-all"
                    >
                      {eventWithCount.registrationUrl}
                    </a>
                  </div>
                </div>
              )}

              {/* 報名人數 */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary flex-shrink-0">
                  <Users className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="text-base text-foreground">
                    {eventWithCount.registrationCount &&
                    eventWithCount.registrationCount > 0
                      ? `已有 ${eventWithCount.registrationCount} 人報名`
                      : "尚未有人報名"}
                  </div>
                  {/* 已報名使用者頭像堆疊 */}
                  {eventWithCount.registrationCount &&
                    eventWithCount.registrationCount > 0 && (
                      <div className="mt-2">
                        <Suspense
                          fallback={<EventRegisteredUsersAvatarsSkeleton />}
                        >
                          <EventRegisteredUsersAvatars
                            eventId={eventWithCount.id}
                          />
                        </Suspense>
                      </div>
                    )}
                </div>
              </div>

              {/* 說明 */}
              {eventWithCount.description && (
                <>
                  <Separator className="my-6" />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-base font-medium text-foreground">
                      <Tag className="h-4 w-4" />
                      活動說明
                    </div>
                    <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {eventWithCount.description}
                    </p>
                  </div>
                </>
              )}

              {/* 報名按鈕 */}
              <Separator className="my-6" />
              <div className="pt-2">
                <EventRegistrationButton
                  eventId={eventWithCount.id}
                  initialIsRegistered={eventWithCount.isRegistered || false}
                  initialRegistrationCount={
                    eventWithCount.registrationCount || 0
                  }
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error("Failed to fetch event:", error);
    notFound();
  }
}
