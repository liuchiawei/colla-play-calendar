// POST /api/public/recording-bookings/cancel
// 外部錄音室預約網站的客人自行取消時呼叫，把場租系統對應的預約標成取消，釋出時段。
// 需帶 x-api-key（RECORDING_BOOKING_API_KEY）。以「電話＋日期＋起訖時間」比對，
// 且只能取消線上預約建立的案子，後台人工建立的錄音室預約不受影響。
import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import prisma from "@/lib/prisma";
import {
  ADMIN_PROJECTS_ANY_WINDOW_CACHE_TAG,
  ADMIN_PROJECTS_LIST_CACHE_TAG,
  projectDetailTag,
} from "@/lib/services/project/project.service";

const RECORDING_SPACE_ID = "4f-podcast-studio";
const ONLINE_CONTACT = "線上預約";

function fail(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

function keyMatches(given: string | null): boolean {
  const expected = process.env.RECORDING_BOOKING_API_KEY;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const digits = (s: string) => s.replace(/\D/g, "");

export async function POST(request: NextRequest) {
  if (!process.env.RECORDING_BOOKING_API_KEY) return fail("預約功能尚未啟用", 503);
  if (!keyMatches(request.headers.get("x-api-key"))) return fail("未授權", 401);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("請提供 JSON 資料", 400);
  }
  const str = (k: string) => (typeof body[k] === "string" ? (body[k] as string).trim() : "");
  const phone = digits(str("customerPhone"));
  const date = str("date");
  const startTime = str("startTime");
  const endTime = str("endTime");
  if (!phone || !date || !startTime || !endTime) {
    return fail("customerPhone、date、startTime、endTime 皆為必填", 400);
  }

  try {
    const candidates = await prisma.project.findMany({
      where: {
        status: { not: "cancelled" },
        collaPlayContactId: ONLINE_CONTACT,
        rentals: { some: { spaceIds: { has: RECORDING_SPACE_ID }, date, startTime, endTime } },
      },
      select: { id: true, customerPhone: true },
    });
    const match = candidates.find((p) => digits(p.customerPhone) === phone);
    if (!match) return fail("找不到這筆預約", 404);

    await prisma.project.update({ where: { id: match.id }, data: { status: "cancelled" } });
    revalidatePath("/dashboard/projects");
    revalidatePath(`/dashboard/projects/${match.id}`);
    revalidateTag(ADMIN_PROJECTS_LIST_CACHE_TAG, "max");
    revalidateTag(ADMIN_PROJECTS_ANY_WINDOW_CACHE_TAG, "max");
    revalidateTag(projectDetailTag(match.id), "max");
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Failed to cancel recording booking:", e);
    return fail("取消預約失敗", 500);
  }
}
