// CollaPlay 週間活動列表頁面 - Server Component
// 上半部顯示週間活動列表，下半部顯示選中的活動詳細資訊

import CalendarPageClient from "./components/calendar-page.client";

export default function CalendarPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <main
        id="main"
        className="relative z-10 container mx-auto px-4 md:px-0 py-8"
      >
        <div className="text-center my-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 font-[var(--font-outfit)]">
            週間活動列表
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            以列表檢視本週活動，工作坊、講座、展演等你來參加！
          </p>
        </div>

        <div className="flex flex-col gap-6 h-full">
          <CalendarPageClient />
        </div>
      </main>
    </div>
  );
}
