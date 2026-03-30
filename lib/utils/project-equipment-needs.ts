// 專案設備勾選：equipmentNeeds JSONB 與表單／API 之間的正規化與解析

import type { ProjectEquipmentNeeds } from "@/lib/types/project";

export const PROJECT_EQUIPMENT_DB_KEYS = [
  "microphone",
  "extensionCord",
  "projector",
  "whiteboard",
] as const satisfies readonly (keyof ProjectEquipmentNeeds)[];

const KEY_SET = new Set<string>(PROJECT_EQUIPMENT_DB_KEYS);

/** 表單預設（全未勾選） */
export function defaultEquipmentNeedsForm(): Required<ProjectEquipmentNeeds> {
  return {
    microphone: false,
    extensionCord: false,
    projector: false,
    whiteboard: false,
  };
}

/**
 * 從 DB Json 還原為表單用 boolean（缺漏鍵視為 false）
 */
export function parseEquipmentNeedsFromDb(
  raw: unknown,
): Required<ProjectEquipmentNeeds> {
  const base = defaultEquipmentNeedsForm();
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return base;
  }
  const o = raw as Record<string, unknown>;
  for (const k of PROJECT_EQUIPMENT_DB_KEYS) {
    base[k] = o[k] === true;
  }
  return base;
}

/**
 * 寫入 DB：僅保留 true，全無則 null
 */
export function normalizeEquipmentNeedsForDb(
  input: ProjectEquipmentNeeds | null | undefined,
): Record<string, boolean> | null {
  if (input == null) return null;
  const out: Record<string, boolean> = {};
  for (const k of PROJECT_EQUIPMENT_DB_KEYS) {
    if (input[k] === true) out[k] = true;
  }
  return Object.keys(out).length > 0 ? out : null;
}

/**
 * API body 驗證：通過則回傳可存庫物件或 null；失敗 throw Error
 */
export function parseEquipmentNeedsFromApiBody(
  value: unknown,
): Record<string, boolean> | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("設備需求格式錯誤");
  }
  const o = value as Record<string, unknown>;
  for (const key of Object.keys(o)) {
    if (!KEY_SET.has(key)) {
      throw new Error(`設備需求含不允許的欄位：${key}`);
    }
    if (typeof o[key] !== "boolean") {
      throw new Error("設備需求欄位須為布林值");
    }
  }
  return normalizeEquipmentNeedsForDb(o as ProjectEquipmentNeeds);
}
