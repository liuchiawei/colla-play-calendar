/**
 * 專案租借「待付金額」計算（場租 + 餐飲 − 已付，不得為負）
 * 與 project.service 寫入 DB 時對三欄金額的整數化邏輯一致。
 */

function nonNegativeIntAmount(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

/**
 * @param parts.rentalAmount 場租
 * @param parts.fnbAmount 餐飲（待定時可忽略，見 fnbAmountPending）
 * @param parts.paidAmount 已付
 * @param parts.fnbAmountPending 為 true 時餐飲視為 0（與 DB 寫入一致）
 * @returns 待付（NT$，非負整數）
 */
export function computeProjectRentalPendingAmount(parts: {
  rentalAmount: unknown;
  fnbAmount: unknown;
  paidAmount: unknown;
  fnbAmountPending?: boolean;
}): number {
  const rental = nonNegativeIntAmount(parts.rentalAmount);
  const fnb = parts.fnbAmountPending
    ? 0
    : nonNegativeIntAmount(parts.fnbAmount);
  const paid = nonNegativeIntAmount(parts.paidAmount);
  return Math.max(0, rental + fnb - paid);
}
