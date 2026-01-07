"use client";

// 回覆表單組件
// 用於回覆特定留言，可摺疊顯示

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommentForm } from "./comment-form";
import type { CommentWithRelations } from "@/lib/types";

interface ReplyFormProps {
  comment: CommentWithRelations;
  eventId: string;
  onSuccess?: () => void;
}

export function ReplyForm({ comment, eventId, onSuccess }: ReplyFormProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // 獲取作者顯示名稱
  const getAuthorName = (comment: CommentWithRelations): string => {
    if (comment.user) {
      return comment.user.name || comment.user.email;
    }
    if (comment.anonymousDisplayNumber) {
      return `匿名用戶 #${comment.anonymousDisplayNumber}`;
    }
    return "匿名用戶";
  };

  const authorName = getAuthorName(comment);

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-start"
      >
        {isOpen ? (
          <>
            <ChevronUp className="size-4 mr-2" />
            取消回覆
          </>
        ) : (
          <>
            <ChevronDown className="size-4 mr-2" />
            回覆 @{authorName}
          </>
        )}
      </Button>
      {isOpen && (
        <div className="pl-4 border-l-2 border-border">
          <CommentForm
            eventId={eventId}
            parentId={comment.id}
            onSuccess={() => {
              setIsOpen(false);
              onSuccess?.();
            }}
            placeholder={`回覆 @${authorName}...`}
          />
        </div>
      )}
    </div>
  );
}
