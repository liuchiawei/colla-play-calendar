import { createAuthClient } from "better-auth/react";

// Better Auth 客戶端：必須在瀏覽器以 window.location.origin 建立，否則模組在無 window
// 的環境被評估時 baseURL 會變成 undefined，better-auth 會改讀 NEXT_PUBLIC_BETTER_AUTH_URL 等而指向錯誤主機。

type AuthClient = ReturnType<typeof createAuthClient>;

let authClientSingleton: AuthClient | null = null;

export function getAuthClient(): AuthClient {
  if (typeof window === "undefined") {
    throw new Error(
      "[auth-client] Better Auth 僅能在瀏覽器使用；請勿在 Server Component 或伺服端呼叫 getAuthClient。"
    );
  }
  if (!authClientSingleton) {
    authClientSingleton = createAuthClient({
      baseURL: window.location.origin,
    });
  }
  return authClientSingleton;
}
