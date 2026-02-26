/**
 * 專案服務 (Project Service)
 *
 * 提供專案建立等業務邏輯，與 create-new-project 表單／API 對接
 */

import prisma from "@/lib/prisma";
import type { CreateProjectInput, ProjectWithRentals } from "@/lib/types/project";

/**
 * 建立專案（含多筆租借項目）
 *
 * 使用 transaction 先建立 Project，再建立所有 ProjectRental。
 * 日期／時間依表單格式存入（date: YYYY-MM-DD, startTime/endTime: HH:mm）。
 *
 * @param input 表單 payload（CreateProjectInput）
 * @returns Promise<ProjectWithRentals>
 */
export async function createProject(
  input: CreateProjectInput
): Promise<ProjectWithRentals> {
  if (!input.rentals?.length) {
    throw new Error("至少需一筆租借項目");
  }

  for (const r of input.rentals) {
    if (!r.spaceIds?.length) {
      throw new Error("每筆租借項目至少需選擇一個場域");
    }
    if (r.endTime <= r.startTime) {
      throw new Error("結束時間必須晚於開始時間");
    }
  }

  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        contactName: input.contactName,
        contactPhone: input.contactPhone,
        company: input.company ?? null,
        taxId: input.taxId ?? null,
        eventOrVenueUse: input.eventOrVenueUse,
        totalAttendees: input.totalAttendees ?? null,
        tables: input.tables ?? null,
        chairs: input.chairs ?? null,
        fnbItems: input.fnbItems ?? null,
        projectNotes: input.projectNotes ?? null,
        collaPlayContactId: input.collaPlayContactId,
        internalNotes: input.internalNotes ?? null,
      },
    });

    for (const r of input.rentals) {
      await tx.projectRental.create({
        data: {
          projectId: created.id,
          date: r.date,
          startTime: r.startTime,
          endTime: r.endTime,
          setupMinutesBefore: r.setupMinutesBefore ?? 30,
          teardownMinutesAfter: r.teardownMinutesAfter ?? 30,
          rentalAmount: Math.max(0, Math.round(r.rentalAmount)),
          fnbAmount: Math.max(0, Math.round(r.fnbAmount)),
          paidAmount: Math.max(0, Math.round(r.paidAmount)),
          pendingAmount: Math.max(0, Math.round(r.pendingAmount)),
          spaceIds: r.spaceIds,
        },
      });
    }

    return tx.project.findUniqueOrThrow({
      where: { id: created.id },
      include: { rentals: true },
    });
  });

  return project as ProjectWithRentals;
}
