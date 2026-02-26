"use client";

// 留言表單組件
// 用於建立新留言

import * as React from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentFormProps {
  eventId: string;
  parentId?: string | null;
  onSuccess?: () => void;
  placeholder?: string;
  className?: string;
}

export function CommentForm({
  eventId,
  parentId,
  onSuccess,
  placeholder = "寫下你的留言...",
  className,
}: CommentFormProps) {
  const [content, setContent] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError("留言內容不能為空");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = parentId
        ? `/api/comments/${parentId}/replies`
        : `/api/events/${eventId}/comments`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          content: content.trim(),
          ...(parentId && { parentId }),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setContent("");
        onSuccess?.();
      } else {
        setError(data.error || "送出失敗");
      }
    } catch (error) {
      console.error("Failed to submit comment:", error);
      setError("送出失敗，請再試一次");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-3">
        {error && <div className="text-sm text-destructive">{error}</div>}
        <Textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setError(null);
          }}
          placeholder={placeholder}
          rows={4}
          disabled={isSubmitting}
          className="resize-none"
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !content.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                送出中...
              </>
            ) : (
              <>
                <Send className="size-4 mr-2" />
                送出
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
