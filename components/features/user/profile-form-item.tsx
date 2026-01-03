"use client";

/**
 * ProfileFormItem - 個人資料資訊項組件
 *
 * 用於顯示個人資料的單個字段，支持：
 * - 條件渲染（根據 isOwner 和 value 決定是否顯示）
 * - 公開狀態指示（Eye/EyeOff 圖標）
 * - 自定義格式化函數
 * - 可選的分隔符
 *
 * @module components/features/user/profile-form-item
 */

import { Eye, EyeOff } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/**
 * ProfileFormItem 組件的屬性接口
 */
export interface ProfileFormItemProps {
  /** 字段標籤 */
  label: string;
  /** 字段值（支持多種類型） */
  value: string | Date | string[] | null | undefined;
  /** 是否公開可見（僅在 isOwner 為 true 時顯示圖標） */
  isVisible?: boolean;
  /** 是否為資料擁有者 */
  isOwner: boolean;
  /** 是否顯示分隔符（默認為 true） */
  showSeparator?: boolean;
  /** 自定義值格式化函數 */
  formatValue?: (value: string | Date | string[] | null | undefined) => string;
  /** 自定義 CSS 類名 */
  className?: string;
  /** 自定義標籤 CSS 類名（擴充點） */
  labelClassName?: string;
  /** 自定義值顯示區域 CSS 類名（擴充點） */
  valueClassName?: string;
  /** 自定義圖標容器 CSS 類名（擴充點） */
  iconContainerClassName?: string;
  /** 是否禁用條件渲染（默認為 false，用於特殊情況下的強制顯示） */
  disableConditionalRender?: boolean;
}

/**
 * ProfileFormItem 組件
 *
 * 顯示個人資料的單個字段，根據 isOwner 和 value 條件決定是否渲染。
 * 當 isOwner 為 false 且 value 為空時，組件不會渲染。
 *
 * @param props - ProfileFormItemProps
 * @returns JSX.Element | null
 *
 * @example
 * ```tsx
 * <ProfileFormItem
 *   label="姓名"
 *   value={profile.displayName}
 *   isVisible={visibility.displayName}
 *   isOwner={true}
 *   showSeparator={true}
 * />
 * ```
 */
export function ProfileFormItem({
  label,
  value,
  isVisible,
  isOwner,
  showSeparator = true,
  formatValue,
  className,
  labelClassName,
  valueClassName,
  iconContainerClassName,
  disableConditionalRender = false,
}: ProfileFormItemProps) {
  // 條件渲染：如果不是 owner 且值為空，且未禁用條件渲染，則不顯示該字段
  if (!disableConditionalRender && !isOwner && !value) {
    return null;
  }

  // 格式化值
  const displayValue = value
    ? formatValue
      ? formatValue(value)
      : typeof value === "string"
      ? value
      : value instanceof Date
      ? value.toLocaleDateString("zh-TW")
      : Array.isArray(value)
      ? value.join(", ")
      : String(value)
    : "尚未填寫";

  // 判斷是否顯示值（用於樣式）
  const hasValue = !!value;

  return (
    <>
      <div className={className}>
        <div className="flex items-center justify-between">
          <div className="w-full flex justify-between items-center gap-2">
            <label
              aria-label={label}
              className={cn(
                "text-sm font-medium text-muted-foreground",
                labelClassName
              )}
            >
              {label}
            </label>
            {isOwner && (
              <div
                aria-label="公開狀態"
                className={cn(
                  "flex items-center gap-2",
                  iconContainerClassName
                )}
              >
                {hasValue && isVisible ? (
                  <Eye className="size-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="size-4 text-muted-foreground/40" />
                )}
              </div>
            )}
          </div>
        </div>
        <p
          className={cn(
            "mt-1 text-base",
            !hasValue && "text-muted-foreground",
            valueClassName
          )}
        >
          {displayValue}
        </p>
      </div>
      {showSeparator && <Separator />}
    </>
  );
}
