// 錄音室預約取消時，通知外部錄音室預約網站把它那份副本也標成取消。
// 對方以「電話＋日期＋起訖時間」比對；找不到回 404，不影響本系統流程。
// 通知失敗一律忽略，最多等 3 秒，不可讓後台取消／刪除因此失敗。
import { after } from "next/server";
import prisma from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

const RECORDING_SPACE_ID = "4f-podcast-studio";
// ponytail: 網址寫死；對方搬到 Cloudflare 後改這一行
const CANCEL_SYNC_URL =
  "https://colla-play-calendar-fork.vercel.app/api/public/recording-bookings/cancel-sync";

type RecordingRental = {
  date: string;
  startTime: string;
  endTime: string;
  project: { customerPhone: string };
};

/** 取得符合條件的錄音室時段；須在刪除／取消「之前」呼叫 */
export function findRecordingRentals(
  where: Prisma.ProjectRentalWhereInput,
): Promise<RecordingRental[]> {
  return prisma.projectRental.findMany({
    where: { ...where, spaceIds: { has: RECORDING_SPACE_ID } },
    select: {
      date: true,
      startTime: true,
      endTime: true,
      project: { select: { customerPhone: true } },
    },
  });
}

/** 回應送出後才在背景通知，不拖慢後台操作 */
export function notifyRecordingCancelled(rentals: RecordingRental[]) {
  const key = process.env.RECORDING_BOOKING_API_KEY;
  if (!key || rentals.length === 0) return;
  after(async () => {
    await Promise.allSettled(
      rentals.map((r) =>
        fetch(CANCEL_SYNC_URL, {
          method: "POST",
          headers: { "content-type": "application/json", "x-api-key": key },
          body: JSON.stringify({
            customerPhone: r.project.customerPhone,
            date: r.date,
            startTime: r.startTime,
            endTime: r.endTime,
          }),
          signal: AbortSignal.timeout(3000),
        }),
      ),
    );
  });
}
