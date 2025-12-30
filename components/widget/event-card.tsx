"use client";

// イベントカードコンポーネント
// カレンダー上に表示されるイベントの視覚的表現

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/date-utils";
import type { EventWithCategory, EventPosition } from "@/lib/types";

interface EventCardProps {
  event: EventWithCategory;
  position: EventPosition;
  index: number;
  onClick: () => void;
}

export function EventCard({ event, position, index, onClick }: EventCardProps) {
  // カテゴリの色またはデフォルト色
  const categoryColor = event.category?.color || "#6366f1";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: index * 0.03,
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
      whileHover={{
        scale: 1.02,
        zIndex: 50,
        boxShadow: "0 8px 25px -5px rgba(0, 0, 0, 0.2)",
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "absolute rounded-md cursor-pointer overflow-hidden",
        "border border-white/20 backdrop-blur-sm",
        "transition-shadow duration-200",
        "after:content-[''] after:absolute after:inset-0 hover:after:bg-linear-to-b hover:after:from-black/70 hover:after:to-transparent after:-z-10 transition-colors duration-200"
      )}
      style={{
        top: `${position.top}%`,
        height: `${position.height}%`,
        left: `${position.left + 2}%`,
        width: `${position.width - 4}%`,
        minHeight: "24px",
        backgroundColor: `${categoryColor}e6`, // 90% opacity
        backgroundImage: `url(${event.imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* カラーアクセントライン */}
      {/* <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: categoryColor }}
      /> */}

      {/* コンテンツ */}
      <div className="pl-2.5 pr-1.5 py-1 h-full flex flex-col z-10">
        {/* 時間表示 */}
        <div className="text-[10px] text-white/80 font-medium shrink-0">
          {formatTime(event.startTime)} - {formatTime(event.endTime)}
        </div>

        {/* タイトル */}
        <div className="text-xs font-semibold text-white leading-tight line-clamp-2 mt-0.5">
          {event.title}
        </div>

        {/* 場所（スペースがある場合） */}
        {position.height > 8 && event.location && (
          <div className="text-[10px] text-white/70 mt-auto truncate">
            📍 {event.location}
          </div>
        )}
      </div>

      {/* ホバー時のオーバーレイ効果 */}
      <motion.div
        className="absolute inset-0 bg-white/0 pointer-events-none"
        whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
      />
    </motion.div>
  );
}

