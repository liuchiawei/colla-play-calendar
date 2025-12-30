"use client";

// CollaPlay 行事曆頁面 - Client Component
// 管理選中的活動狀態，並渲染行事曆和詳細資訊面板

import * as React from "react";
import { WeeklyCalendar } from "@/components/widget/weekly-calendar";
import { EventDetailPanel } from "./event-detail-panel";
import { EventDetailDialog } from "@/components/widget/event-detail-dialog";
import type { EventWithCategory } from "@/lib/types";

export default function CalendarPageClient() {
  // 選中的活動
  const [selectedEvent, setSelectedEvent] =
    React.useState<EventWithCategory | null>(null);
  // 詳細資訊對話框的開閉狀態
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);

  // 處理活動選擇
  const handleEventSelect = React.useCallback((event: EventWithCategory) => {
    setSelectedEvent(event);
  }, []);

  // 打開詳細資訊對話框
  const handleOpenDialog = React.useCallback(() => {
    if (selectedEvent) {
      setDetailDialogOpen(true);
    }
  }, [selectedEvent]);

  return (
    <>
      {/* 上半部：週間行事曆 */}
      <div className="flex-1 bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-xl overflow-hidden min-h-[400px]">
        <WeeklyCalendar
          className="h-full scrollbar-thin"
          onEventSelect={handleEventSelect}
          enableInternalDialog={false}
        />
      </div>

      {/* 下半部：活動詳細資訊面板 */}
      <EventDetailPanel event={selectedEvent} onOpenDialog={handleOpenDialog} />

      {/* 詳細資訊對話框 */}
      <EventDetailDialog
        event={selectedEvent}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </>
  );
}
