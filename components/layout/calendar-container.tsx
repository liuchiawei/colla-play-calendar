"use client";

import { motion } from "motion/react";
import { WeeklyCalendar } from "@/components/features/calendar/weekly-calendar";

export default function CalendarContainer() {
  return (
    <div className="min-h-screen">
      {/* メインコンテンツ */}
      <main className="relative z-10 container mx-auto px-4 py-12">
        {/* タイトルセクション */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 font-[var(--font-outfit)]">
            週間活動行事曆
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            探索 CollaPlay 的精彩活動，工作坊、講座、展演等你來參加！
          </p>
        </motion.div>

        {/* カレンダーカード */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-xl overflow-hidden"
          style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}
        >
          <WeeklyCalendar className="h-full scrollbar-thin" />
        </motion.div>

        {/* フッター情報 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-6 text-center text-sm text-muted-foreground"
        >
          點擊活動卡片查看詳細資訊 • 使用左右箭頭切換週次
        </motion.p>
      </main>
    </div>
  );
}
