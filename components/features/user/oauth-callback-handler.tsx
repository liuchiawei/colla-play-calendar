"use client";

// OAuth 回調處理組件
// 在 OAuth 回調後清除快取並同步 Google avatar，確保獲取最新數據
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { revalidateCache } from "@/lib/services/auth/auth.service";

/**
 * OAuth 回調處理組件
 *
 * 此組件會在 OAuth 回調後自動：
 * 1. 同步 Google profile picture（如果是 Google OAuth）
 * 2. 清除相關快取
 * 3. 刷新頁面以獲取最新數據
 *
 * 應該放在需要處理 OAuth 回調的頁面中（例如 profile 頁面）
 */
export function OAuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // 防止重複處理
    if (hasProcessed.current) {
      return;
    }

    // 檢查是否為 OAuth 回調（通過 URL 參數或 referrer）
    const isOAuthCallback =
      searchParams.get("oauth_callback") === "true" ||
      searchParams.get("from") === "google" ||
      document.referrer?.includes("/api/auth/callback");

    if (isOAuthCallback) {
      hasProcessed.current = true;

      // 檢查是否為 Google OAuth
      // 優先檢查 URL 參數，然後檢查 referrer
      const isGoogleOAuth =
        searchParams.get("from") === "google" ||
        document.referrer?.includes("/api/auth/callback/google") ||
        document.referrer?.includes("google.com/oauth");

      // 如果是 Google OAuth，先同步 avatar
      if (isGoogleOAuth) {
        fetch("/api/auth/sync-google-avatar", {
          method: "POST",
          credentials: "include",
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success && data.data?.synced) {
              console.log(
                "[OAuth Callback Handler] Google avatar synced:",
                data.data.imageUrl
              );
            }
          })
          .catch((error) => {
            console.error(
              "[OAuth Callback Handler] Failed to sync Google avatar:",
              error
            );
          })
          .finally(() => {
            // 無論同步成功與否，都清除快取並刷新頁面
            revalidateCache(["user-auth", "profile"])
              .then(() => {
                router.refresh();
              })
              .catch((error) => {
                console.error(
                  "[OAuth Callback Handler] Failed to clear cache:",
                  error
                );
                router.refresh();
              });
          });
      } else {
        // 非 Google OAuth，只清除快取
        revalidateCache(["user-auth", "profile"])
          .then(() => {
            router.refresh();
          })
          .catch((error) => {
            console.error(
              "[OAuth Callback Handler] Failed to clear cache:",
              error
            );
            router.refresh();
          });
      }
    }
  }, [searchParams, router]);

  // 此組件不渲染任何內容
  return null;
}
