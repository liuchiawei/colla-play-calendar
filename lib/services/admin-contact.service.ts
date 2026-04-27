/**
 * Server-only: 取得 CollaPlay 窗口選單用管理員清單（id + name）
 * 使用 unstable_cache() 跨 request 長快取
 */

import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

export type AdminContactOption = { id: string; name: string };

const ADMIN_CONTACT_OPTIONS_TTL_SECONDS = 60 * 60 * 6;

export const ADMIN_CONTACT_OPTIONS_CACHE_TAG = "admin:contact-options";

export async function getAdminContactOptions(): Promise<AdminContactOption[]> {
  return unstable_cache(
    async () => {
      const users = await prisma.user.findMany({
        where: { isAdmin: true },
        select: { id: true, name: true, email: true },
        orderBy: { createdAt: "asc" },
      });
      return users.map((u) => ({
        id: u.id,
        name: u.name ?? u.email ?? u.id,
      }));
    },
    ["admin-contact-options"],
    { revalidate: ADMIN_CONTACT_OPTIONS_TTL_SECONDS, tags: [ADMIN_CONTACT_OPTIONS_CACHE_TAG] },
  )();
}
