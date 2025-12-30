'use client';

import { motion } from 'motion/react';
import { WeeklyCalendar } from '@/components/widget/weekly-calendar';

export default function MainContainer() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* 背景デコレーション */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* グラデーションオーブ */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full"
          style={{
            background:
              "radial-gradient(circle, oklch(0.72 0.18 25 / 0.3) 0%, transparent 70%)",
          }}
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, oklch(0.7 0.15 180 / 0.2) 0%, transparent 70%)",
          }}
        />
        {/* グリッドパターン */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      </div>

      {/* メインコンテンツ */}
      <main className="relative z-10 container mx-auto px-4 py-6">
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