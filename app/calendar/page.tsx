// CollaPlay 新版行事曆頁面 - Server Component
// 上半部顯示週間行事曆，下半部顯示選中的活動詳細資訊

import CalendarPageClient from "./components/calendar-page.client";

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* 背景デコレーション */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* グラデーションオーブ */}
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full"
          style={{
            background:
              "radial-gradient(circle, oklch(0.72 0.18 25 / 0.3) 0%, transparent 70%)",
          }}
        />
        <div
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
      <main className="relative z-10 container mx-auto px-4 py-8">
        {/* タイトルセクション */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 font-[var(--font-outfit)]">
            週間活動行事曆
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            探索 CollaPlay 的精彩活動，工作坊、講座、展演等你來參加！
          </p>
        </div>

        {/* カレンダーと詳細情報のレイアウト（上下分割） */}
        <div className="flex flex-col gap-6 h-full">
          <CalendarPageClient />
        </div>
      </main>
    </div>
  );
}
