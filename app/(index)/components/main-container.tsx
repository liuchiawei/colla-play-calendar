"use client";

import { motion } from "motion/react";
import { DailyCalendar } from "@/components/features/calendar/daily-calendar";

export default function MainContainer() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* メインコンテンツ */}
      <main className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-center px-4">
        {/* タイトルセクション */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1"
        >
          <h2 className="text-xl font-bold text-foreground mb-2 font-[var(--font-outfit)]">
            Daily Schedule
          </h2>
          <p className="text-muted-foreground">
            探索 CollaPlay 的精彩活動，工作坊、講座、展演等你來參加！
          </p>
        </motion.div>

        <section className="w-full flex-1 flex flex-col items-center justify-center">
          {/* カレンダーカード */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="w-full max-w-2xl mx-auto bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-xl overflow-hidden"
            style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}
          >
            <DailyCalendar className="h-full scrollbar-thin" />
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
        </section>
      </main>
    </div>
  );
}
