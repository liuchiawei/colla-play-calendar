"use client";

import * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function parseTimeValue(value: string | null | undefined): {
  hour: string;
  minute: string;
  isValid: boolean;
} {
  const raw = String(value ?? "").trim();
  if (!raw) return { hour: "", minute: "", isValid: false };

  const m = /^(\d{1,2}):(\d{2})$/.exec(raw);
  if (!m) return { hour: "", minute: "", isValid: false };

  const hourNum = Number(m[1]);
  const minuteNum = Number(m[2]);
  if (
    !Number.isFinite(hourNum) ||
    !Number.isFinite(minuteNum) ||
    hourNum < 0 ||
    hourNum > 23 ||
    minuteNum < 0 ||
    minuteNum > 59
  ) {
    return { hour: "", minute: "", isValid: false };
  }

  return { hour: pad2(hourNum), minute: pad2(minuteNum), isValid: true };
}

function buildMinuteOptions(step: number) {
  const safeStep =
    Number.isFinite(step) && step > 0 && step <= 60 ? Math.floor(step) : 5;

  // 60 必須可整除，否則會產生不齊的分鐘選項；不符合時退回 5 分鐘。
  const finalStep = 60 % safeStep === 0 ? safeStep : 5;

  const options: string[] = [];
  for (let m = 0; m < 60; m += finalStep) {
    options.push(pad2(m));
  }
  return options;
}

export type TimePickerProps = {
  value: string;
  onValueChange: (next: string) => void;
  minuteStep?: number;
  disabled?: boolean;
  className?: string;
  hourAriaLabel?: string;
  minuteAriaLabel?: string;
};

export function TimePicker({
  value,
  onValueChange,
  minuteStep = 5,
  disabled,
  className,
  hourAriaLabel,
  minuteAriaLabel,
}: TimePickerProps) {
  const parsed = React.useMemo(() => parseTimeValue(value), [value]);
  const minuteOptions = React.useMemo(
    () => buildMinuteOptions(minuteStep),
    [minuteStep],
  );

  const hourValue = parsed.isValid ? parsed.hour : "";
  const minuteValue = parsed.isValid ? parsed.minute : "";

  const hourOptions = React.useMemo(() => {
    const out: string[] = [];
    for (let h = 0; h < 24; h += 1) out.push(pad2(h));
    return out;
  }, []);

  return (
    <div className={cn("flex w-full gap-2", className)}>
      <Select
        value={hourValue}
        onValueChange={(nextHour) => {
          const hour = nextHour;
          const minute = minuteValue || "00";
          onValueChange(`${hour}:${minute}`);
        }}
        disabled={disabled}
      >
        <SelectTrigger
          className="w-full"
          aria-label={hourAriaLabel}
          disabled={disabled}
        >
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent>
          {hourOptions.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={minuteValue}
        onValueChange={(nextMinute) => {
          const hour = hourValue || "00";
          const minute = nextMinute;
          onValueChange(`${hour}:${minute}`);
        }}
        disabled={disabled}
      >
        <SelectTrigger
          className="w-full"
          aria-label={minuteAriaLabel}
          disabled={disabled}
        >
          <SelectValue placeholder="mm" />
        </SelectTrigger>
        <SelectContent>
          {minuteOptions.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

