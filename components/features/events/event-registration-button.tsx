"use client";

// 活動報名按鈕組件
// 處理活動報名/取消報名的互動功能

import * as React from "react";
import { mutate } from "swr";
import { Users, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventRegistrationButtonProps {
  eventId: string;
  initialIsRegistered: boolean;
  initialRegistrationCount: number;
}

export function EventRegistrationButton({
  eventId,
  initialIsRegistered,
  initialRegistrationCount,
}: EventRegistrationButtonProps) {
  const [isRegistered, setIsRegistered] = React.useState(initialIsRegistered);
  const [registrationCount, setRegistrationCount] = React.useState(
    initialRegistrationCount
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // 處理報名/取消報名
  const handleRegistration = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const method = isRegistered ? "DELETE" : "POST";
      const response = await fetch(`/api/events/${eventId}/register`, {
        method,
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setIsRegistered(!isRegistered);
        // 更新報名人數
        if (isRegistered) {
          setRegistrationCount((prev) => Math.max(0, prev - 1));
        } else {
          setRegistrationCount((prev) => prev + 1);
        }
        // 使 SWR 快取失效，自動重新驗證活動紀錄
        // 服務端快取已在 API route 中清除
        mutate("/api/profile/events");
      } else {
        setError(data.error || "操作失敗");
      }
    } catch (err) {
      setError("操作失敗，請再試一次");
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <div className="text-sm text-destructive text-center">{error}</div>
      )}
      <Button
        className="w-full"
        variant={isRegistered ? "outline" : "default"}
        onClick={handleRegistration}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 mr-2 animate-spin" />
            報名中...
          </>
        ) : isRegistered ? (
          <>
            <CheckCircle2 className="size-4 mr-2" />
            已報名（點擊取消）
          </>
        ) : (
          <>
            <Users className="size-4 mr-2" />
            立即報名
          </>
        )}
      </Button>
    </div>
  );
}
