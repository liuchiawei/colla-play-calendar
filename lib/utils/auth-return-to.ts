/**
 * 從 HTTP Referer 解析登入/註冊成功後的安全導向路徑。
 * 僅允許站內相對路徑，避免 open redirect。
 */

/** 不應作為 returnTo 的頁面前綴（避免登入後回到登入/註冊造成循環） */
const EXCLUDED_PATH_PREFIXES = ["/login", "/register"] as const;

/**
 * 依目前請求的 Host / 轉發標頭推導允許的 origin（與 Referer 比對用）。
 */
export function getRequestOriginFromHeaders(headers: Headers): string | null {
  const host =
    headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    headers.get("host")?.trim();
  if (!host) {
    return null;
  }

  const forwardedProto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto =
    forwardedProto === "http" || forwardedProto === "https"
      ? forwardedProto
      : process.env.NODE_ENV === "production"
        ? "https"
        : "http";

  try {
    return new URL(`${proto}://${host}`).origin;
  } catch {
    return null;
  }
}

/**
 * 將 Referer 轉成 pathname + search；無效或不符合安全規則時回傳 null。
 * @param allowedOrigin 若提供，Referer 必須與此 origin 相同（避免外站 Referer 偽造路徑）。
 */
export function getReturnToFromReferer(
  referer: string | null,
  allowedOrigin?: string | null
): string | null {
  if (!referer?.trim()) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(referer);
  } catch {
    return null;
  }

  if (allowedOrigin) {
    const isDev = process.env.NODE_ENV !== "production";
    if (!isDev) {
      if (url.origin !== allowedOrigin) return null;
    } else {
      const normalizeLoopbackOrigin = (origin: string) => {
        try {
          const o = new URL(origin);
          const host = o.hostname === "127.0.0.1" ? "localhost" : o.hostname;
          return `${o.protocol}//${host}${o.port ? `:${o.port}` : ""}`;
        } catch {
          return origin;
        }
      };

      if (normalizeLoopbackOrigin(url.origin) !== normalizeLoopbackOrigin(allowedOrigin)) {
        return null;
      }
    }
  }

  const pathWithSearch = `${url.pathname}${url.search}`;

  if (!pathWithSearch.startsWith("/") || pathWithSearch.startsWith("//")) {
    return null;
  }

  for (const prefix of EXCLUDED_PATH_PREFIXES) {
    if (pathWithSearch === prefix || pathWithSearch.startsWith(`${prefix}/`)) {
      return null;
    }
    if (pathWithSearch.startsWith(`${prefix}?`)) {
      return null;
    }
  }

  return pathWithSearch;
}
