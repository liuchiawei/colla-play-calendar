import { createAuthClient } from "better-auth/react";

// Better Auth 客戶端設定
// 同網域策略：不指定 baseURL 時會自動使用相對路徑，避免 SSL/Mixed Content 問題
// 僅在需要跨網域時才設定 NEXT_PUBLIC_APP_URL（必須是合法 URL，不可有雙協定）
function getBaseURL(): string | undefined {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  // 環境變數が存在しない場合は同網域モード
  if (!envUrl) {
    return undefined;
  }
  
  // 不合法な URL パターンをチェック（雙協定など）
  let trimmedUrl = envUrl.trim();
  const hasDoubleProtocol =
    trimmedUrl.includes("http://https://") ||
    trimmedUrl.includes("https://http://") ||
    /^https?:\/\/https?:\/\//.test(trimmedUrl);
  
  if (hasDoubleProtocol) {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.warn(
        "[Better Auth] NEXT_PUBLIC_APP_URL 包含不合法格式（雙協定），將使用同網域模式。",
        "請修正為單一協定，例如：http://localhost:3000 或 https://yourdomain.com",
        "目前值：",
        envUrl
      );
    }
    return undefined; // 不合法な場合は同網域モードにフォールバック
  }
  
  // URL の合法性を検証
  try {
    const url = new URL(trimmedUrl);
    // プロトコルが http または https であることを確認
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Invalid protocol");
    }
    
    // 開發環境での特別処理：https://localhost を検出した場合は同網域モードにフォールバック
    // （本地開發環境通常沒有 SSL 憑證，會導致 ERR_SSL_PROTOCOL_ERROR）
    // 自動修正よりも安全な同網域モードを使用する方が確実
    if (
      process.env.NODE_ENV === "development" &&
      url.protocol === "https:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1")
    ) {
      if (typeof window !== "undefined") {
        console.warn(
          "[Better Auth] 檢測到 https://localhost，本地開發環境應使用 http://localhost 或同網域模式。",
          "已自動切換為同網域模式（相對路徑）以避免 SSL 錯誤。",
          "建議在 .env 中：",
          "1. 移除 NEXT_PUBLIC_APP_URL（推薦，使用同網域模式），或",
          "2. 設為 NEXT_PUBLIC_APP_URL=http://localhost:3000"
        );
      }
      // 同網域モードにフォールバック（undefined を返す）
      return undefined;
    }
    
    return trimmedUrl;
  } catch {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.warn(
        "[Better Auth] NEXT_PUBLIC_APP_URL 不是合法 URL，將使用同網域模式。",
        "值：",
        envUrl
      );
    }
    return undefined; // 同網域模式，使用相對路徑
  }
}

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});
