// 建立／編輯專案表單：活動類型選項與表單狀態還原（最終寫入 eventType 字串；舊欄位名沿用於部分函式以維持相容）

/** 預設活動類型（含「其他」— 選其他時另填自訂文字） */
export const PROJECT_ACTIVITY_TYPE_OPTIONS = [
  "場租",
  "空間企劃",
  "分潤合作",
  "場地贊助",
  "店內活動",
  "商業攝影",
  "酒吧包場",
  "其他",
] as const;

export type ProjectActivityTypeOption = (typeof PROJECT_ACTIVITY_TYPE_OPTIONS)[number];

export const PROJECT_ACTIVITY_TYPE_OTHER: ProjectActivityTypeOption = "其他";

/** 表單用：非預設字串時 Select 使用此 sentinel 並顯示自填欄 */
export const PROJECT_ACTIVITY_CUSTOM_SENTINEL = "__custom__" as const;

const PRESET_SET = new Set<string>(PROJECT_ACTIVITY_TYPE_OPTIONS);

export function isProjectActivityPreset(value: string): value is ProjectActivityTypeOption {
  return PRESET_SET.has(value);
}

/** 表單 Select 允許的值：預設選項或自訂 sentinel */
export function isActivityTypePresetFieldValue(value: string): boolean {
  return (
    isProjectActivityPreset(value) || value === PROJECT_ACTIVITY_CUSTOM_SENTINEL
  );
}

/**
 * 由 DB 的 eventType 還原表單：預設選項或自訂
 */
export function splitActivityTypeForForm(eventType: string): {
  preset: ProjectActivityTypeOption | typeof PROJECT_ACTIVITY_CUSTOM_SENTINEL;
  customDetail: string;
} {
  if (isProjectActivityPreset(eventType)) {
    if (eventType === PROJECT_ACTIVITY_TYPE_OTHER) {
      return { preset: PROJECT_ACTIVITY_TYPE_OTHER, customDetail: "" };
    }
    return { preset: eventType, customDetail: "" };
  }
  return {
    preset: PROJECT_ACTIVITY_CUSTOM_SENTINEL,
    customDetail: eventType,
  };
}

/**
 * 表單送出：得到要寫入 eventType 的字串
 */
export function resolveEventTypeFromForm(
  preset: string,
  customDetail: string,
): string {
  if (preset === PROJECT_ACTIVITY_CUSTOM_SENTINEL) {
    return customDetail.trim();
  }
  if (preset === PROJECT_ACTIVITY_TYPE_OTHER) {
    return customDetail.trim();
  }
  return preset;
}

/** @deprecated 請改用 resolveEventTypeFromForm（保留以向後相容舊引用） */
export const resolveEventOrVenueUseFromForm = resolveEventTypeFromForm;
