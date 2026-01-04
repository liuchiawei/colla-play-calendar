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
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EventRegistrationButton } from "@/components/features/events/event-registration-button";
import { EventRegisteredUsersAvatars } from "@/components/features/events/event-registered-users-avatars";
import { Suspense } from "react";
import { EventRegisteredUsersAvatarsSkeleton } from "@/components/features/events/event-registered-users-avatars-skeleton";
import SectionContainer from "@/components/layout/section-container";

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
      <SectionContainer>
        {/* 主內容 */}
        {/* 圖片區塊 */}
        <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-6 shadow-lg">
          {eventWithCount.imageBlobUrl || eventWithCount.imageUrl ? (
            <img
              src={eventWithCount.imageBlobUrl || eventWithCount.imageUrl || ""}
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
        <div className="w-full bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-xl p-6 md:p-8">
          {/* 標題 */}
          <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-6 font-[var(--font-outfit)]">
            {eventWithCount.title}
          </h1>

          {/* 活動完整資料 (基本資料、說明、報名按鈕) */}
          <div className="space-y-4">
            {/* 活動基本資料 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 日時資訊 */}
              <EventBasicInfoItem icon={Calendar}>
                <div className="flex flex-col md:flex-row gap-1 md:gap-2">
                  <div className="flex items-center gap-1 font-medium text-foreground">
                    <Calendar className="size-3" />
                    {formatDate(eventWithCount.startTime)}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="size-3" />
                    {formatTime(eventWithCount.startTime)} -{" "}
                    {formatTime(eventWithCount.endTime)}
                  </div>
                </div>
              </EventBasicInfoItem>

              {/* 地點 */}
              {eventWithCount.location && (
                <EventBasicInfoItem icon={MapPin}>
                  <div className="text-base text-foreground">
                    {eventWithCount.location}
                  </div>
                </EventBasicInfoItem>
              )}

              {/* 主辦者 */}
              {eventWithCount.organizer && (
                <EventBasicInfoItem icon={User}>
                  <div className="text-base text-foreground">
                    {eventWithCount.organizer}
                  </div>
                </EventBasicInfoItem>
              )}

              {/* 價格 */}
              {eventWithCount.price && (
                <EventBasicInfoItem icon={Ticket}>
                  <div className="text-base text-foreground">
                    {eventWithCount.price}
                  </div>
                </EventBasicInfoItem>
              )}

              {/* 報名網址 */}
              {eventWithCount.registrationUrl && (
                <EventBasicInfoItem icon={ExternalLink}>
                  <a
                    href={eventWithCount.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    {eventWithCount.registrationUrl}
                  </a>
                </EventBasicInfoItem>
              )}

              {/* 報名人數 */}
              <EventBasicInfoItem icon={Users}>
                <div className="flex-1 flex flex-col md:flex-row items-center gap-1 md:gap-2">
                  <div className="text-base text-foreground">
                    {eventWithCount.registrationCount &&
                    eventWithCount.registrationCount > 0
                      ? `已有 ${eventWithCount.registrationCount} 人報名`
                      : "尚未有人報名"}
                  </div>
                  {/* 已報名使用者頭像堆疊 */}
                  {eventWithCount.registrationCount &&
                    eventWithCount.registrationCount > 0 && (
                      <Suspense
                        fallback={<EventRegisteredUsersAvatarsSkeleton />}
                      >
                        <EventRegisteredUsersAvatars
                          eventId={eventWithCount.id}
                        />
                      </Suspense>
                    )}
                </div>
              </EventBasicInfoItem>
            </div>

            <Separator />

            {/* 說明 */}
            {eventWithCount.description && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-base font-medium text-foreground">
                  <Tag className="h-4 w-4" />
                  活動說明
                </div>
                <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {eventWithCount.description}
                </p>
              </div>
            )}

            {/* 報名按鈕 */}
            <EventRegistrationButton
              eventId={eventWithCount.id}
              initialIsRegistered={eventWithCount.isRegistered || false}
              initialRegistrationCount={eventWithCount.registrationCount || 0}
            />
          </div>
        </div>
      </SectionContainer>
    );
  } catch (error) {
    console.error("Failed to fetch event:", error);
    notFound();
  }
}

const EventBasicInfoItem = ({
  icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) => {
  const Icon = icon;
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-full bg-primary/10 text-primary flex-shrink-0">
        <Icon className="size-4" />
      </div>
      {children}
    </div>
  );
};
