"use client";

// 頭像上傳組件
// 可重用的頭像上傳組件，支援預覽和上傳功能
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload, X, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  // 當前頭像 URL
  currentAvatarUrl?: string | null;
  // 用戶名稱（用於 fallback）
  userName?: string | null;
  // 上傳成功回調
  onUploadSuccess?: (url: string) => void;
  // 上傳失敗回調
  onUploadError?: (error: string) => void;
  // 自訂 className
  className?: string;
  // 頭像大小
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "size-16",
  md: "size-24",
  lg: "size-32",
};

export function AvatarUpload({
  currentAvatarUrl,
  userName,
  onUploadSuccess,
  onUploadError,
  className,
  size = "md",
}: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fetchUser, user } = useAuthStore();

  // 處理檔案選擇
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // 驗證檔案類型
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        const errorMsg = "不支援的檔案類型。僅允許：JPEG, PNG, GIF, WebP";
        setError(errorMsg);
        onUploadError?.(errorMsg);
        return;
      }

      // 驗證檔案大小（5MB）
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        const errorMsg = `檔案大小超過限制（最大 5MB）`;
        setError(errorMsg);
        onUploadError?.(errorMsg);
        return;
      }

      // 顯示預覽
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // 清除錯誤
      setError(null);

      // 上傳檔案
      setIsUploading(true);
      try {
        // 上傳到 Vercel Blob
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch("/api/uploads/user-avatar", {
          method: "POST",
          body: formData,
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResult.success || !uploadResult.data) {
          throw new Error(uploadResult.error || "上傳失敗");
        }

        const { url } = uploadResult.data;

        // 更新用戶頭像
        const updateResponse = await fetch("/api/auth/me", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: url }),
        });

        const updateResult = await updateResponse.json();

        if (!updateResult.success) {
          throw new Error(updateResult.error || "更新頭像失敗");
        }

        // 清除快取
        try {
          await fetch("/api/revalidate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              tags: ["user-auth"],
              userId: user?.id || undefined,
            }),
          });
        } catch (revalidateError) {
          console.error("Failed to revalidate cache:", revalidateError);
        }

        // 更新 auth store
        await fetchUser();

        // 清除預覽（使用新的 URL）
        setPreviewUrl(null);

        // 成功回調
        onUploadSuccess?.(url);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "上傳失敗，請再試一次";
        setError(errorMsg);
        setPreviewUrl(null);
        onUploadError?.(errorMsg);
      } finally {
        setIsUploading(false);
        // 重置 input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [onUploadSuccess, onUploadError, fetchUser]
  );

  // 處理移除檔案
  const handleRemoveFile = useCallback(() => {
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // 取得顯示的頭像 URL
  const displayAvatarUrl = previewUrl || currentAvatarUrl;

  // 取得 fallback 文字（用戶名稱的首字母）
  const getFallbackText = () => {
    if (userName) {
      return userName.charAt(0).toUpperCase();
    }
    return "?";
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* 頭像顯示 */}
      <div className="relative">
        <Avatar className={cn(sizeMap[size])}>
          <AvatarImage src={displayAvatarUrl || undefined} alt={userName || "頭像"} />
          <AvatarFallback className="text-lg font-semibold">
            {getFallbackText()}
          </AvatarFallback>
        </Avatar>
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <Loader2 className="size-6 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="w-full rounded-md bg-destructive/10 p-2 text-sm text-destructive text-center">
          {error}
        </div>
      )}

      {/* 上傳按鈕 */}
      <div className="flex items-center gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="avatar-upload-input"
          disabled={isUploading}
        />
        <label htmlFor="avatar-upload-input" className="cursor-pointer">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            className="gap-2"
            asChild
          >
            <span>
              {isUploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  上傳中...
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  上傳頭像
                </>
              )}
            </span>
          </Button>
        </label>
        {previewUrl && !isUploading && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemoveFile}
            className="gap-2"
          >
            <X className="size-4" />
            取消
          </Button>
        )}
      </div>
    </div>
  );
}

