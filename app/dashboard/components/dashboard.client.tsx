"use client";

// CollaPlay 後台管理頁面（Client Component）
// イベントとカテゴリの管理を行う

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, Plus, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { EventForm } from "@/components/features/events/event-form";
import { DashboardSidebar } from "@/components/features/dashboard/dashboard-sidebar";
import { DashboardContent } from "@/components/features/dashboard/dashboard-content";
import type {
  EventWithCategory,
  EventInput,
  Category,
  CategoryInput,
  EventRegistrationWithUser,
} from "@/lib/types";
import type { DashboardTab } from "@/lib/config";

export default function DashboardClient() {
  // 當前選中的 tab
  const [activeTab, setActiveTab] = React.useState<DashboardTab>("events");
  // イベントデータ
  const [events, setEvents] = React.useState<EventWithCategory[]>([]);
  // カテゴリデータ
  const [categories, setCategories] = React.useState<Category[]>([]);
  // ローディング状態
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  // 検索・フィルタ
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterCategory, setFilterCategory] = React.useState<string>("all");
  // フォームダイアログ
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] =
    React.useState<EventWithCategory | null>(null);
  // 削除確認ダイアログ
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  // 報名列表ダイアログ
  const [registrationsEventId, setRegistrationsEventId] = React.useState<
    string | null
  >(null);
  const [registrations, setRegistrations] = React.useState<
    EventRegistrationWithUser[]
  >([]);
  const [isLoadingRegistrations, setIsLoadingRegistrations] =
    React.useState(false);

  // データ取得
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [eventsRes, categoriesRes] = await Promise.all([
        fetch("/api/events"),
        fetch("/api/categories"),
      ]);
      const eventsData = await eventsRes.json();
      const categoriesData = await categoriesRes.json();

      if (eventsData.success) setEvents(eventsData.data);
      if (categoriesData.success) setCategories(categoriesData.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // イベント作成・更新
  const handleEventSubmit = async (data: EventInput) => {
    setIsSubmitting(true);
    try {
      const url = editingEvent
        ? `/api/events/${editingEvent.id}`
        : "/api/events";
      const method = editingEvent ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchData();
        setFormOpen(false);
        setEditingEvent(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // イベント削除
  const handleEventDelete = async () => {
    if (!deleteId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/events/${deleteId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchData();
        setDeleteId(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // カテゴリ操作
  const handleCategoryAdd = async (data: CategoryInput) => {
    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (response.ok) await fetchData();
  };

  const handleCategoryUpdate = async (id: string, data: CategoryInput) => {
    const response = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (response.ok) await fetchData();
  };

  const handleCategoryDelete = async (id: string) => {
    const response = await fetch(`/api/categories/${id}`, {
      method: "DELETE",
    });
    if (response.ok) await fetchData();
  };

  // 取得報名列表
  const fetchRegistrations = React.useCallback(async (eventId: string) => {
    setIsLoadingRegistrations(true);
    try {
      const response = await fetch(`/api/events/${eventId}/registrations`);
      const data = await response.json();
      if (data.success) {
        setRegistrations(data.data);
      } else {
        console.error("Failed to fetch registrations:", data.error);
        setRegistrations([]);
      }
    } catch (error) {
      console.error("Failed to fetch registrations:", error);
      setRegistrations([]);
    } finally {
      setIsLoadingRegistrations(false);
    }
  }, []);

  // 開啟報名列表
  const handleViewRegistrations = (eventId: string) => {
    setRegistrationsEventId(eventId);
    fetchRegistrations(eventId);
  };

  // 編集開始
  const startEditing = (event: EventWithCategory) => {
    setEditingEvent(event);
    setFormOpen(true);
  };

  // 新規作成開始
  const startCreating = () => {
    setEditingEvent(null);
    setFormOpen(true);
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* 側邊欄 */}
      <DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 主內容區域 */}
      <SidebarInset>
        {/* ヘッダー */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-border/40 bg-card/80 backdrop-blur-md sticky top-0 z-50"
        >
          <div className="flex h-16 items-center gap-4 px-4">
            <SidebarTrigger />
            <div className="flex items-center gap-4 flex-1">
              <Link href="/">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <LayoutDashboard className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">後台管理</h1>
                  <p className="text-xs text-muted-foreground">
                    CollaPlay 活動管理系統
                  </p>
                </div>
              </div>
            </div>
            {activeTab === "events" && (
              <Button onClick={startCreating} className="gap-2">
                <Plus className="h-4 w-4" />
                新增活動
              </Button>
            )}
          </div>
        </motion.header>

        {/* メインコンテンツ */}
        <main className="flex-1 p-6">
          <DashboardContent
            activeTab={activeTab}
            events={events}
            categories={categories}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterCategory={filterCategory}
            onFilterCategoryChange={setFilterCategory}
            onRefresh={fetchData}
            onEdit={startEditing}
            onDelete={setDeleteId}
            onViewRegistrations={handleViewRegistrations}
            onCategoryAdd={handleCategoryAdd}
            onCategoryUpdate={handleCategoryUpdate}
            onCategoryDelete={handleCategoryDelete}
          />
        </main>
      </SidebarInset>

      {/* イベントフォームダイアログ */}
      <EventForm
        event={editingEvent}
        categories={categories}
        open={formOpen}
        onOpenChange={(open: boolean) => {
          setFormOpen(open);
          if (!open) setEditingEvent(null);
        }}
        onSubmit={handleEventSubmit}
        isLoading={isSubmitting}
      />

      {/* 報名列表ダイアログ */}
      <Dialog
        open={!!registrationsEventId}
        onOpenChange={(open) => {
          if (!open) {
            setRegistrationsEventId(null);
            setRegistrations([]);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>報名列表</DialogTitle>
          </DialogHeader>
          {isLoadingRegistrations ? (
            <div className="py-8 text-center text-muted-foreground">
              載入中...
            </div>
          ) : registrations.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              尚無報名記錄
            </div>
          ) : (
            <div className="space-y-2">
              {registrations.map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {reg.user ? (
                      <>
                        {reg.user.image && (
                          <img
                            src={reg.user.image}
                            alt={reg.user.name || reg.user.email}
                            className="h-10 w-10 rounded-full"
                          />
                        )}
                        <div>
                          <div className="font-medium">
                            {reg.user.name || reg.user.email}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {reg.user.email}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div>
                        <div className="font-medium">匿名用戶</div>
                        <div className="text-sm text-muted-foreground">
                          匿名報名
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(reg.createdAt).toLocaleString("zh-TW")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除此活動？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。活動將從行事曆中永久移除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEventDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "刪除中..." : "確定刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
