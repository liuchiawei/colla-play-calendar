"use client";

// 個人資料標籤頁組件
// 整合個人資料編輯和活動紀錄兩個標籤

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileForm from "./profile-form";
import { EventsTab } from "./events-tab";
import type { Profile } from "@/lib/types";
import { User, Calendar } from "lucide-react";

interface ProfileTabsProps {
  initialProfile: Profile | null;
}

export function ProfileTabs({ initialProfile }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = React.useState("profile");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="profile" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          個人資料
        </TabsTrigger>
        <TabsTrigger value="events" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          活動紀錄
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-6">
        <ProfileForm initialProfile={initialProfile} />
      </TabsContent>

      <TabsContent value="events" className="mt-6">
        <EventsTab />
      </TabsContent>
    </Tabs>
  );
}

