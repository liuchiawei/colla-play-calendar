"use client";

// 活動留言討論區組件
// 整合留言列表、分頁、表單等功能

import * as React from "react";
import {
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";
import type { CommentListResponse, CommentWithRelations } from "@/lib/types";
import useSWR from "swr";

interface EventInteractionsProps {
  eventId: string;
  currentUserId?: string | null;
  currentAnonymousSessionId?: string | null;
}

const fetcher = async (url: string): Promise<CommentListResponse> => {
  const response = await fetch(url, {
    credentials: "include",
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "獲取留言失敗");
  }
  return data.data;
};

export function EventInteractions({
  eventId,
  currentUserId,
  currentAnonymousSessionId,
}: EventInteractionsProps) {
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  // 使用 SWR 獲取留言列表
  const { data, error, isLoading, mutate } = useSWR<CommentListResponse>(
    `/api/events/${eventId}/comments?page=${page}&pageSize=${pageSize}`,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
    }
  );

  // 處理留言成功後重新載入
  const handleCommentSuccess = () => {
    mutate();
  };

  // 處理分頁
  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (data && page < data.totalPages) {
      setPage(page + 1);
    }
  };

  return (
    <Card className="w-full rounded-2xl border border-border/50 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="size-5" />
          留言討論區
          {data && (
            <span className="text-sm font-normal text-muted-foreground">
              （{data.total} 則留言）
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="w-full space-y-6">
        {/* 留言列表 */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {/* 錯誤提示 */}
        {error && (
          <div className="text-center py-8 text-destructive">
            載入留言失敗：{error instanceof Error ? error.message : "未知錯誤"}
          </div>
        )}
        {/* 空狀態 */}
        {data && data.comments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            尚無留言，成為第一個留言的人吧！
          </div>
        )}
        {/* 留言列表 */}
        {data && data.comments.length > 0 && (
          <>
            <div className="space-y-6">
              {data.comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  eventId={eventId}
                  currentUserId={currentUserId}
                  currentAnonymousSessionId={currentAnonymousSessionId}
                  onUpdate={handleCommentSuccess}
                />
              ))}
            </div>

            {/* 分頁控制 */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  第 {page} / {data.totalPages} 頁，共 {data.total} 則留言
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={page === 1 || isLoading}
                  >
                    <ChevronLeft className="size-4 mr-1" />
                    上一頁
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={page >= data.totalPages || isLoading}
                  >
                    下一頁
                    <ChevronRight className="size-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        {/* 新增留言表單 */}
        <CommentForm
          eventId={eventId}
          onSuccess={handleCommentSuccess}
          placeholder="寫下你的留言..."
        />
      </CardContent>
    </Card>
  );
}
