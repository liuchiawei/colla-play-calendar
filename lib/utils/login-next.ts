/**
 * 建立帶 `next` query 的登入連結，並確保 next 僅能是站內相對路徑。
 */

export type NextSearchParams = Record<string, string | string[] | undefined>;

const EXCLUDED_PATH_PREFIXES = ["/login", "/register"] as const;

export function isSafeNextPath(nextPath: string): boolean {
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return false;
  }

  for (const prefix of EXCLUDED_PATH_PREFIXES) {
    if (nextPath === prefix || nextPath.startsWith(`${prefix}/`)) {
      return false;
    }
    if (nextPath.startsWith(`${prefix}?`)) {
      return false;
    }
  }

  return true;
}

export function buildLoginUrlWithNext(nextPath: string): string {
  if (!isSafeNextPath(nextPath)) {
    return "/login";
  }
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

export function getNextFromSearchParams(searchParams: NextSearchParams): string | null {
  const nextParam = searchParams.next;
  if (typeof nextParam !== "string") return null;
  if (!isSafeNextPath(nextParam)) return null;
  return nextParam;
}

export function buildPathWithSearch(
  pathname: string,
  searchParams: NextSearchParams | undefined
): string {
  if (!searchParams) return pathname;

  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      sp.set(key, value);
    } else if (Array.isArray(value)) {
      sp.delete(key);
      for (const v of value) {
        sp.append(key, v);
      }
    }
  }

  const qs = sp.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

