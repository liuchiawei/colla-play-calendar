/**
 * 專案複製：將來源專案轉為「建立表單」可用的預填資料。
 *
 * - 文字欄位也預先填入（使用者可直接修改後送出）
 * - 金額欄位一律重設為 0（避免複製到舊金額/已付款）
 */

import type { ProjectWithRentals } from "@/lib/types/project";
import {
  projectToFormValues,
  type ProjectFormValues,
} from "@/lib/config/project-form-config";

export function buildDuplicateProjectPrefill(
  source: ProjectWithRentals,
): ProjectFormValues {
  const fv = projectToFormValues(source);

  return {
    ...fv,
    rentals: fv.rentals.map((r) => ({
      ...r,
      rentalAmount: 0,
      fnbAmount: 0,
      paidAmount: 0,
      fnbAmountPending: false,
    })),
  };
}

