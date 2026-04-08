// Better Auth 伺服端設定：OAuth 回跳、登入後導向、Cookie 網域皆依 baseURL。
// 目的註解：說明為何 localhost 登入後會跳到正式站，以及本檔如何修正。

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
// If your Prisma file is located elsewhere, you can change the path
import prisma from "@/lib/prisma";

/**
 * 解析 Better Auth 的 baseURL。
 * 開發時若僅在 .env 保留正式站的 BETTER_AUTH_URL，OAuth 完成後的 Location／callback
 * 仍會以正式站為主機，瀏覽器就會被導向生產網址。
 * 優先順序：BETTER_AUTH_DEV_URL →（本機網址的）BETTER_AUTH_URL／NEXT_PUBLIC_APP_URL → http://localhost:PORT
 */
function resolveBetterAuthBaseURL(): string | undefined {
  const betterAuthUrl = process.env.BETTER_AUTH_URL?.trim();
  const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (process.env.NODE_ENV !== "development") {
    return betterAuthUrl || publicAppUrl;
  }

  const devOnly = process.env.BETTER_AUTH_DEV_URL?.trim();
  if (devOnly) {
    return devOnly;
  }

  const isLoopbackUrl = (url: string | undefined): url is string => {
    if (!url) return false;
    try {
      const { hostname } = new URL(url);
      return hostname === "localhost" || hostname === "127.0.0.1";
    } catch {
      return false;
    }
  };

  if (isLoopbackUrl(betterAuthUrl)) return betterAuthUrl;
  if (isLoopbackUrl(publicAppUrl)) return publicAppUrl;

  const port = process.env.PORT || "3000";
  return `http://localhost:${port}`;
}

/**
 * 開發環境：請求的 Origin 常為 http://localhost:PORT 或 http://127.0.0.1:PORT，
 * 若 BETTER_AUTH_URL 指向正式站，預設 trustedOrigins 不含本機，會回傳 403 Invalid origin。
 */
function devLocalhostTrustedOrigins(request: Request | undefined) {
  if (process.env.NODE_ENV !== "development" || !request) {
    return [];
  }
  const origin = request.headers.get("origin");
  if (
    origin &&
    (origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:"))
  ) {
    return [origin];
  }
  return [];
}

export const auth = betterAuth({
  baseURL: resolveBetterAuthBaseURL(),
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: async (request) => devLocalhostTrustedOrigins(request),
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
});
