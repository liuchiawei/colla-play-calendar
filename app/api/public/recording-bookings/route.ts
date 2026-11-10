// POST /api/public/recording-bookings
// 外部錄音室預約網站寫入預約：建立一筆 Podcast 錄音室專案（洽談中）。
// 需帶 x-api-key（環境變數 RECORDING_BOOKING_API_KEY），只能從對方伺服器呼叫，不可放前端。
// 沿用 createProject 的時段衝突檢查：與既有專案重疊時回 409。
import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  ADMIN_PROJECTS_ANY_WINDOW_CACHE_TAG,
  ADMIN_PROJECTS_LIST_CACHE_TAG,
  createProject,
  ProjectRentalConflictError,
} from "@/lib/services/project/project.service";
import { isValidRentalTimeWindow } from "@/lib/utils/project-rental-interval";

const RECORDING_SPACE_ID = "4f-podcast-studio";
const ONLINE_CONTACT = "線上預約";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

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

function text(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t && t.length <= max ? t : null;
}

export async function POST(request: NextRequest) {
  if (!process.env.RECORDING_BOOKING_API_KEY) return fail("預約功能尚未啟用", 503);
  if (!keyMatches(request.headers.get("x-api-key"))) return fail("未授權", 401);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("請提供 JSON 資料", 400);
  }

  const customerName = text(body.customerName, 100);
  const customerPhone = text(body.customerPhone, 30);
  const date = text(body.date, 10);
  const startTime = text(body.startTime, 5);
  const endTime = text(body.endTime, 5);
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 1000) : "";

  if (!customerName) return fail("customerName 為必填（100 字內）", 400);
  if (!customerPhone) return fail("customerPhone 為必填", 400);
  if (!date || !DATE_RE.test(date)) return fail("date 格式需為 YYYY-MM-DD", 400);
  if (!startTime || !TIME_RE.test(startTime) || !endTime || !TIME_RE.test(endTime)) {
    return fail("startTime、endTime 格式需為 HH:mm", 400);
  }
  if (!isValidRentalTimeWindow({ date, startTime, endTime })) {
    return fail("結束時間需晚於開始時間", 400);
  }

  try {
    // ponytail: 衝突檢查與寫入不在同一個 transaction，同一秒同時段的兩筆可能都成功；量大再加鎖
    const project = await createProject({
      customerName,
      customerPhone,
      eventOrVenueUse: "錄音室線上預約",
      eventType: "其他",
      collaPlayContactId: ONLINE_CONTACT,
      projectNotes: notes || undefined,
      internalNotes: "線上預約系統建立",
      needsPrintedNotice: false,
      rentals: [
        {
          spaceIds: [RECORDING_SPACE_ID],
          date,
          startTime,
          endTime,
          rentalAmount: 0,
          fnbAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
        },
      ],
    });
    revalidatePath("/dashboard/projects");
    revalidateTag(ADMIN_PROJECTS_LIST_CACHE_TAG, "max");
    revalidateTag(ADMIN_PROJECTS_ANY_WINDOW_CACHE_TAG, "max");
    return NextResponse.json({ success: true, data: { id: project.id } }, { status: 201 });
  } catch (e) {
    if (e instanceof ProjectRentalConflictError) return fail("這個時段已被預約", 409);
    console.error("Failed to create recording booking:", e);
    return fail("建立預約失敗", 500);
  }
}
