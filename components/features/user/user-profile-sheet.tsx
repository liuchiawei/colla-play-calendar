"use client";

// 用戶個人資料 Sheet 組件
// 顯示用戶基本信息和頭像上傳功能
import { useState } from "react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AvatarUpload } from "../../widget/avatar-upload";
import { useAuthStore } from "@/lib/stores/auth-store";
import { User, Mail, ExternalLink } from "lucide-react";

export function UserProfileSheet() {
  const { user } = useAuthStore();
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // 處理上傳成功
  const handleUploadSuccess = () => {
    setUploadSuccess(true);
    // 3 秒後清除成功訊息
    setTimeout(() => {
      setUploadSuccess(false);
    }, 3000);
  };

  return (
    <SheetContent side="right" className="w-full sm:max-w-md">
      {user ? (
        <>
          <SheetHeader>
            <SheetTitle>個人資料</SheetTitle>
            <SheetDescription>查看和管理您的個人資料資訊</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* 頭像上傳區塊 */}
            <div className="flex flex-col items-center">
              <AvatarUpload
                currentAvatarUrl={user.image}
                userName={user.name || user.email}
                onUploadSuccess={handleUploadSuccess}
                size="lg"
              />
              {uploadSuccess && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                  頭像更新成功！
                </p>
              )}
            </div>

            <Separator />

            {/* 用戶信息 */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="mt-0.5 size-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    姓名
                  </p>
                  <p className="mt-1 text-base">{user.name || "未設定"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 size-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    電子郵件
                  </p>
                  <p className="mt-1 text-base">{user.email}</p>
                </div>
              </div>

              {user.isAdmin && (
                <div className="rounded-md bg-primary/10 p-3">
                  <p className="text-sm font-medium text-primary">管理員</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    您擁有系統管理員權限
                  </p>
                </div>
              )}
            </div>
          </div>

          <SheetFooter className="flex-col gap-2 sm:flex-col">
            <Button asChild className="w-full gap-2" variant="default">
              <Link href="/profile">
                <ExternalLink className="size-4" />
                前往完整個人資料頁面
              </Link>
            </Button>
          </SheetFooter>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full py-8">
          <p className="text-muted-foreground">載入中...</p>
        </div>
      )}
    </SheetContent>
  );
}
