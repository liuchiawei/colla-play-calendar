// CollaPlay 週間活動行事曆 - メインページ
// 週間カレンダービューを表示し、イベントを閲覧可能
import Hero from "@/components/layout/hero";
import MainContainer from "./components/main-container";
import { EventCarousel } from "@/components/features/events/event-carousel";

export default function HomePage() {
  return (
    <>
      <Hero />
      <EventCarousel />
      <MainContainer />
    </>
  );
}
