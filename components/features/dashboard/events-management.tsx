"use client";

// 活動管理組件
// 從 dashboard.client.tsx 提取的活動管理相關邏輯和 UI

import * as React from "react";
import { motion } from "motion/react";
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Users,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatTime } from "@/lib/date-utils";
import { EventStatusBadge } from "@/components/features/events/event-status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type {
  EventWithCategory,
  EventInput,
  Category,
  EventRegistrationWithUser,
  EventStatus,
} from "@/lib/types";

interface EventsManagementProps {
  events: EventWithCategory[];
  categories: Category[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterCategory: string;
  onFilterCategoryChange: (category: string) => void;
  onRefresh: () => void;
  onEdit: (event: EventWithCategory) => void;
  onDelete: (eventId: string) => void;
  onViewRegistrations: (eventId: string) => void;
  onReview?: (eventId: string, status: EventStatus) => Promise<void>;
}

export function EventsManagement({
  events,
  categories,
  isLoading,
  searchQuery,
  onSearchChange,
  filterCategory,
  onFilterCategoryChange,
  onRefresh,
  onEdit,
  onDelete,
  onViewRegistrations,
  onReview,
}: EventsManagementProps) {
  const [statusFilter, setStatusFilter] = React.useState<EventStatus | "all">("all");
  const [reviewEventId, setReviewEventId] = React.useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = React.useState<EventStatus>("published");
  const [isReviewing, setIsReviewing] = React.useState(false);

  // 過濾活動
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
    const matchesStatus =
      statusFilter === "all" || event.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // 處理審核
  const handleReview = async () => {
    if (!reviewEventId || !onReview) return;

    setIsReviewing(true);
    try {
      await onReview(reviewEventId, reviewStatus);
      setReviewEventId(null);
      setReviewStatus("published");
    } catch (error) {
      console.error("Failed to review event:", error);
      alert("審核失敗");
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 搜尋・篩選欄 */}
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
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={onFilterCategoryChange}>
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
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as EventStatus | "all")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="篩選狀態" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部狀態</SelectItem>
            <SelectItem value="draft">草稿</SelectItem>
            <SelectItem value="pending">待審核</SelectItem>
            <SelectItem value="published">已發布</SelectItem>
            <SelectItem value="rejected">已拒絕</SelectItem>
            <SelectItem value="archived">已歸檔</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
        </Button>
      </motion.div>

      {/* 活動表格 */}
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
              <TableHead>狀態</TableHead>
              <TableHead>地點</TableHead>
              <TableHead>報名人數</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // 載入中骨架
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
              // 空狀態
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
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
                  <TableCell>
                    <EventStatusBadge status={event.status || "pending"} />
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
                      {event.status === "pending" && onReview && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary"
                          onClick={() => {
                            setReviewEventId(event.id);
                            setReviewStatus("published");
                          }}
                          title="審核活動"
                        >
                          <Filter className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onViewRegistrations(event.id)}
                        title="查看報名"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(event)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(event.id)}
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

      {/* 統計資訊 */}
      {!isLoading && (
        <div className="text-sm text-muted-foreground text-center">
          共 {filteredEvents.length} 個活動
          {filteredEvents.length !== events.length &&
            ` (全部 ${events.length} 個)`}
        </div>
      )}

      {/* 審核對話框 */}
      <Dialog open={!!reviewEventId} onOpenChange={(open) => !open && setReviewEventId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>審核活動</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">選擇審核結果</label>
              <Select value={reviewStatus} onValueChange={(value) => setReviewStatus(value as EventStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">通過（發布）</SelectItem>
                  <SelectItem value="rejected">拒絕</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewEventId(null)}
              disabled={isReviewing}
            >
              取消
            </Button>
            <Button
              onClick={handleReview}
              disabled={isReviewing}
            >
              {isReviewing ? "處理中..." : "確認審核"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}









