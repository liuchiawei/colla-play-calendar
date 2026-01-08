"use client";

// 活動狀態標籤組件
// 顯示不同狀態的視覺標籤，使用不同顏色區分狀態

import type { EventStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EventStatusBadgeProps {
  status: EventStatus;
  className?: string;
}

/**
 * 獲取狀態對應的標籤樣式
 */
function getStatusStyles(status: EventStatus): {
  variant: "default" | "secondary" | "destructive" | "outline";
  label: string;
} {
  switch (status) {
    case "draft":
      return {
        variant: "outline",
        label: "草稿",
      };
    case "pending":
      return {
        variant: "secondary",
        label: "待審核",
      };
    case "published":
      return {
        variant: "default",
        label: "已發布",
      };
    case "rejected":
      return {
        variant: "destructive",
        label: "已拒絕",
      };
    case "archived":
      return {
        variant: "outline",
        label: "已歸檔",
      };
    default:
      return {
        variant: "outline",
        label: "未知",
      };
  }
}

export function EventStatusBadge({ status, className }: EventStatusBadgeProps) {
  const { variant, label } = getStatusStyles(status);

  return (
    <Badge variant={variant} className={cn("text-xs", className)}>
      {label}
    </Badge>
  );
}
