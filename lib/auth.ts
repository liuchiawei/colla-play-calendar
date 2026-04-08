import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
// If your Prisma file is located elsewhere, you can change the path
import prisma from "@/lib/prisma";

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
