"use client";

// 留言項目組件
// 顯示單一留言，包含 Like、Reply、Edit、Delete 功能

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Heart, Edit2, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import UserAvatar from "@/components/features/user/user-avatar";
import { ReplyForm } from "./reply-form";
import { CommentForm } from "./comment-form";
import type { CommentWithRelations } from "@/lib/types";

interface CommentItemProps {
  comment: CommentWithRelations;
  eventId: string;
  currentUserId?: string | null;
  currentAnonymousSessionId?: string | null;
  onUpdate?: () => void;
  depth?: number; // 巢狀深度（最多 3 層）
}

export function CommentItem({
  comment,
  eventId,
  currentUserId,
  currentAnonymousSessionId,
  onUpdate,
  depth = 0,
}: CommentItemProps) {
  const [isLiked, setIsLiked] = React.useState(comment.isLiked || false);
  const [likeCount, setLikeCount] = React.useState(comment._count.likes);
  const [isLiking, setIsLiking] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [editContent, setEditContent] = React.useState(comment.content);
  const [error, setError] = React.useState<string | null>(null);

  // 檢查是否為作者
  const isAuthor =
    (currentUserId && comment.userId === currentUserId) ||
    (currentAnonymousSessionId &&
      comment.anonymousSessionId === currentAnonymousSessionId);

  // 獲取作者顯示名稱
  const getAuthorName = (): string => {
    if (comment.user) {
      return comment.user.name || comment.user.email;
    }
    if (comment.anonymousDisplayNumber) {
      return `匿名用戶 #${comment.anonymousDisplayNumber}`;
    }
    return "匿名用戶";
  };

  const authorName = getAuthorName();

  // 獲取作者頭像 fallback（僅用於匿名用戶）
  const getAuthorAvatarFallback = () => {
    if (comment.user) {
      return (comment.user.name || comment.user.email || "U")
        .charAt(0)
        .toUpperCase();
    }
    return "#";
  };

  // 處理按讚
  const handleLike = async () => {
    setIsLiking(true);
    setError(null);

    try {
      const response = await fetch(`/api/comments/${comment.id}/like`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setIsLiked(data.data.isLiked);
        setLikeCount(data.data.likeCount);
      } else {
        setError(data.error || "按讚失敗");
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
      setError("按讚失敗，請再試一次");
    } finally {
      setIsLiking(false);
    }
  };

  // 處理編輯
  const handleEdit = async () => {
    if (!editContent.trim()) {
      setError("留言內容不能為空");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ content: editContent.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setIsEditing(false);
        onUpdate?.();
      } else {
        setError(data.error || "更新失敗");
      }
    } catch (error) {
      console.error("Failed to update comment:", error);
      setError("更新失敗，請再試一次");
    } finally {
      setIsDeleting(false);
    }
  };

  // 處理刪除
  const handleDelete = async () => {
    if (!confirm("確定要刪除此留言嗎？此操作無法復原。")) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        onUpdate?.();
      } else {
        setError(data.error || "刪除失敗");
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
      setError("刪除失敗，請再試一次");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        {/* 頭像 */}
        {comment.user ? (
          <UserAvatar user={comment.user} className="size-8 shrink-0" />
        ) : (
          <Avatar className="size-8 shrink-0">
            <AvatarFallback>{getAuthorAvatarFallback()}</AvatarFallback>
          </Avatar>
        )}

        {/* 留言內容 */}
        <div className="flex-1 space-y-2">
          {/* 作者和時間 */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{authorName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
                locale: zhTW,
              })}
            </span>
            {comment.updatedAt.getTime() !== comment.createdAt.getTime() && (
              <span className="text-xs text-muted-foreground">（已編輯）</span>
            )}
          </div>

          {/* 錯誤訊息 */}
          {error && <div className="text-sm text-destructive">{error}</div>}

          {/* 留言內容或編輯表單 */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                title="編輯留言"
                placeholder="編輯留言..."
                value={editContent}
                onChange={(e) => {
                  setEditContent(e.target.value);
                  setError(null);
                }}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isDeleting}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleEdit}
                  disabled={isDeleting || !editContent.trim()}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="size-3 mr-1 animate-spin" />
                      儲存中...
                    </>
                  ) : (
                    "儲存"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                    setError(null);
                  }}
                  disabled={isDeleting}
                >
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm whitespace-pre-wrap break-words">
              {comment.content}
            </div>
          )}

          {/* 操作按鈕 */}
          {!isEditing && (
            <div className="flex items-center gap-4">
              {/* 按讚 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={isLiking}
                className="h-8"
              >
                {isLiking ? (
                  <Loader2 className="size-4 mr-1 animate-spin" />
                ) : (
                  <Heart
                    className={`size-4 mr-1 ${
                      isLiked ? "fill-red-500 text-red-500" : ""
                    }`}
                  />
                )}
                <span className="text-xs">{likeCount}</span>
              </Button>

              {/* 回覆（最多 3 層深度） */}
              {depth < 3 && (
                <ReplyForm
                  comment={comment}
                  eventId={eventId}
                  onSuccess={onUpdate}
                />
              )}

              {/* 編輯和刪除（僅作者可見） */}
              {isAuthor && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    disabled={isDeleting}
                    className="h-8"
                  >
                    <Edit2 className="size-4 mr-1" />
                    <span className="text-xs">編輯</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="h-8 text-destructive hover:text-destructive"
                  >
                    {isDeleting ? (
                      <Loader2 className="size-4 mr-1 animate-spin" />
                    ) : (
                      <Trash2 className="size-4 mr-1" />
                    )}
                    <span className="text-xs">刪除</span>
                  </Button>
                </>
              )}
            </div>
          )}

          {/* 回覆列表 */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-3 pl-4 border-l-2 border-border">
              {comment.replies.map((reply: CommentWithRelations) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  eventId={eventId}
                  currentUserId={currentUserId}
                  currentAnonymousSessionId={currentAnonymousSessionId}
                  onUpdate={onUpdate}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
