/**
 * Server-only: 取得 CollaPlay 窗口選單用管理員清單（id + name）
 * 使用 React.cache() 同 request 內去重
 */

import { cache } from "react";
import prisma from "@/lib/prisma";

export type AdminContactOption = { id: string; name: string };

export const getAdminContactOptions = cache(
  async (): Promise<AdminContactOption[]> => {
    const users = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "asc" },
    });
    return users.map((u) => ({
      id: u.id,
      name: u.name ?? u.email ?? u.id,
    }));
  }
);
