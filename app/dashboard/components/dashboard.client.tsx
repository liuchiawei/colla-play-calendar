"use client";

// CollaPlay 後台管理頁面（Client Component）
// イベントとカテゴリの管理を行う

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Search,
  Filter,
  Sparkles,
  LayoutDashboard,
  Tag,
  RefreshCw,
  Users,
  Eye,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Skeleton } from "@/components/ui/skeleton";
import { EventForm } from "@/components/widget/event-form";
import { CategoryManager } from "@/components/widget/category-manager";
import UserManagementClient from "./user-management.client";
import { formatDate, formatTime } from "@/lib/date-utils";
import type {
  EventWithCategory,
  EventInput,
  Category,
  CategoryInput,
  EventRegistrationWithUser,
} from "@/lib/types";

export default function DashboardClient() {
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
  const [registrationsEventId, setRegistrationsEventId] = React.useState<string | null>(null);
  const [registrations, setRegistrations] = React.useState<EventRegistrationWithUser[]>([]);
  const [isLoadingRegistrations, setIsLoadingRegistrations] = React.useState(false);

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

  // フィルタリングされたイベント
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "all" ||
      (filterCategory === "none"
        ? !event.categoryId
        : event.categoryId === filterCategory);
    return matchesSearch && matchesCategory;
  });

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
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border/40 bg-card/80 backdrop-blur-md sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
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
            <Button onClick={startCreating} className="gap-2">
              <Plus className="h-4 w-4" />
              新增活動
            </Button>
          </div>
        </div>
      </motion.header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="w-full mx-auto">
            <TabsTrigger value="events" className="gap-2">
              <Calendar className="h-4 w-4" />
              活動管理
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Tag className="h-4 w-4" />
              類型管理
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              會員管理
            </TabsTrigger>
          </TabsList>

          {/* 活動管理タブ */}
          <TabsContent value="events" className="space-y-4">
            {/* 検索・フィルタバー */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋活動名稱、說明、地點..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="篩選類型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部類型</SelectItem>
                  <SelectItem value="none">無分類</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchData}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </motion.div>

            {/* 活動テーブル */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="border rounded-lg overflow-hidden bg-card"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">活動名稱</TableHead>
                    <TableHead>日期時間</TableHead>
                    <TableHead>類型</TableHead>
                    <TableHead>地點</TableHead>
                    <TableHead>報名人數</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // ローディングスケルトン
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-5 w-[200px]" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-[150px]" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-[80px]" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-[120px]" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-[80px]" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-8 w-[80px] ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredEvents.length === 0 ? (
                    // 空の状態
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="text-muted-foreground">
                          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">目前沒有活動</p>
                          <p className="text-sm">
                            {searchQuery || filterCategory !== "all"
                              ? "嘗試調整搜尋條件"
                              : "點擊「新增活動」來建立第一個活動"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    // 活動列表
                    filteredEvents.map((event, index) => (
                      <motion.tr
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="group hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {event.category && (
                              <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{
                                  backgroundColor: event.category.color,
                                }}
                              />
                            )}
                            <span className="truncate max-w-[220px]">
                              {event.title}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDate(event.startTime)}</div>
                            <div className="text-muted-foreground">
                              {formatTime(event.startTime)} -{" "}
                              {formatTime(event.endTime)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {event.category ? (
                            <Badge
                              variant="secondary"
                              style={{
                                backgroundColor: `${event.category.color}20`,
                                color: event.category.color,
                              }}
                            >
                              {event.category.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              無分類
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {event.location || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {event.registrationCount || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleViewRegistrations(event.id)}
                              title="查看報名"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => startEditing(event)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(event.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </motion.div>

            {/* 統計情報 */}
            {!isLoading && (
              <div className="text-sm text-muted-foreground text-center">
                共 {filteredEvents.length} 個活動
                {filteredEvents.length !== events.length &&
                  ` (全部 ${events.length} 個)`}
              </div>
            )}
          </TabsContent>

          {/* 類型管理タブ */}
          <TabsContent value="categories">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto bg-card border rounded-lg p-6"
            >
              <CategoryManager
                categories={categories}
                onAdd={handleCategoryAdd}
                onUpdate={handleCategoryUpdate}
                onDelete={handleCategoryDelete}
              />
            </motion.div>
          </TabsContent>

          {/* 會員管理タブ */}
          <TabsContent value="users">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <UserManagementClient />
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>

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
