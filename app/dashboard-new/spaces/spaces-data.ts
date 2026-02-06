// 場域靜態資料 - 依樓層分組，供 SpacesTabs 使用

export type FloorKey = "3F" | "4F" | "5F";

export interface Space {
  id: string;
  floor: FloorKey;
  name: string;
  description: string;
}

const parseNameDesc = (floor: FloorKey, label: string, idSuffix: string): Space => {
  const [name = "", description = ""] = label.split("／");
  return { id: `${floor.toLowerCase()}-${idSuffix}`, floor, name: name.trim(), description: description.trim() };
};

export const SPACES_3F: Space[] = [
  parseNameDesc("3F", "頻率交流道／社群咖啡廳", "frequency"),
  parseNameDesc("3F", "背對世界的時間／專注工作區", "focus"),
];

export const SPACES_4F: Space[] = [
  parseNameDesc("4F", "空白分頁／多功能教室", "multipurpose-1"),
  parseNameDesc("4F", "空白分頁／多功能教室", "multipurpose-2"),
  parseNameDesc("4F", "艾莉緹的相機／小物攝影間", "arriety"),
  parseNameDesc("4F", "WUCOLIN／活動交誼廳", "wucolin"),
  parseNameDesc("4F", "第三人稱／播映室", "third-person"),
];

export const SPACES_5F: Space[] = [
  parseNameDesc("5F", "大氣層／展演廳", "atmosphere"),
];

export const SPACES_BY_FLOOR: Record<FloorKey, Space[]> = {
  "3F": SPACES_3F,
  "4F": SPACES_4F,
  "5F": SPACES_5F,
};

export const ALL_SPACES: Space[] = [
  ...SPACES_3F,
  ...SPACES_4F,
  ...SPACES_5F,
];
