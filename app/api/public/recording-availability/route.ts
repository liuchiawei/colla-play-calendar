// GET /api/public/recording-availability?from=YYYY-MM-DD&to=YYYY-MM-DD
// 公開唯讀：回傳 Podcast 錄音室被佔用的時段，供外部錄音室預約網站查詢空檔。
// 只回傳日期與時間，不含任何客戶資料或金額。
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const RECORDING_SPACE_ID = "4f-podcast-studio";
const MAX_RANGE_DAYS = 93;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60",
};

function isValidDate(s: string | null): s is string {
  return !!s && DATE_RE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
}

function error(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status, headers: HEADERS });
}

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  if (!isValidDate(from) || !isValidDate(to)) {
    return error("請提供 from 與 to，格式為 YYYY-MM-DD", 400);
  }
  const days = (Date.parse(to) - Date.parse(from)) / 86_400_000;
  if (days < 0 || days > MAX_RANGE_DAYS) {
    return error(`查詢區間需介於 0 到 ${MAX_RANGE_DAYS} 天`, 400);
  }

  try {
    const rentals = await prisma.projectRental.findMany({
      where: {
        spaceIds: { has: RECORDING_SPACE_ID },
        // 取消的案子不算佔用；洽談中仍算佔用，避免重複預約
        project: { status: { not: "cancelled" } },
        date: { lte: to },
        OR: [{ endDate: { gte: from } }, { endDate: null, date: { gte: from } }],
      },
      // 只取時間欄位，確保不會帶出客戶資料
      select: {
        date: true,
        endDate: true,
        startTime: true,
        endTime: true,
        setupMinutesBefore: true,
        teardownMinutesAfter: true,
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    const data = rentals.map((r) => ({
      date: r.date,
      endDate: r.endDate ?? r.date,
      startTime: r.startTime,
      endTime: r.endTime,
      setupMinutesBefore: r.setupMinutesBefore,
      teardownMinutesAfter: r.teardownMinutesAfter,
    }));

    return NextResponse.json({ success: true, data }, { headers: HEADERS });
  } catch (e) {
    console.error("Failed to fetch recording availability:", e);
    return error("取得錄音室時段失敗", 500);
  }
}
