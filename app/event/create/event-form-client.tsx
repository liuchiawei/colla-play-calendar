"use client";

// 創建活動表單客戶端組件
// 處理表單提交和導向邏輯

import * as React from "react";
import { useRouter } from "next/navigation";
import { EventForm } from "@/components/features/events/event-form";
import type { Category, EventInput } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface EventFormClientProps {
  categories: Category[];
}

export function EventFormClient({ categories }: EventFormClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(true);

  // 處理表單提交
  const handleSubmit = async (data: EventInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "創建活動失敗");
      }

      // 提交成功後導向 profile page 的「我的活動」標籤
      router.push("/profile?tab=my-events");
    } catch (error) {
      console.error("Failed to create event:", error);
      alert(error instanceof Error ? error.message : "創建活動失敗");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 處理對話框關閉
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // 如果表單關閉，導向 profile page
      router.push("/profile");
    }
    setFormOpen(open);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            創建活動
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            填寫下方表單以創建新活動。活動提交後將由管理員審核。
          </p>
        </CardContent>
      </Card>

      <EventForm
        event={null}
        categories={categories}
        open={formOpen}
        onOpenChange={handleOpenChange}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        allowDraft={true}
      />
    </div>
  );
}
