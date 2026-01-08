"use client";

// 個人資料標籤頁組件
// 整合個人資料編輯和活動紀錄兩個標籤

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileForm from "../../components/features/user/profile-form";
import { EventsTab } from "../../components/features/events/events-tab";
import { MyEventsTab } from "../../components/features/events/my-events-tab";
import { OAuthCallbackHandler } from "../../components/features/user/oauth-callback-handler";
import type { Profile } from "@/lib/types";
import { User, Calendar, FileText } from "lucide-react";

interface ProfileTabsProps {
  initialProfile: Profile | null;
}

export function ProfileTabs({ initialProfile }: ProfileTabsProps) {
  // 從 URL 參數獲取初始 tab（如果有的話）
  const [activeTab, setActiveTab] = React.useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "my-events" || tab === "events" || tab === "profile") {
        return tab;
      }
    }
    return "profile";
  });

  return (
    <>
      {/* OAuth 回調處理器 */}
      <OAuthCallbackHandler />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* 上方標籤列表 */}
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="size-4" />
            個人資料
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="size-4" />
            活動紀錄
          </TabsTrigger>
          <TabsTrigger value="my-events" className="flex items-center gap-2">
            <FileText className="size-4" />
            我的活動
          </TabsTrigger>
        </TabsList>
        {/* 個人資料頁 */}
        <TabsContent value="profile">
          <ProfileForm initialProfile={initialProfile} />
        </TabsContent>
        {/* 活動紀錄頁 */}
        <TabsContent value="events">
          <EventsTab />
        </TabsContent>
        {/* 我的活動頁 */}
        <TabsContent value="my-events">
          <MyEventsTab />
        </TabsContent>
      </Tabs>
    </>
  );
}
