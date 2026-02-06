// CollaPlay 週間活動行事曆 - メインページ
// 週間カレンダービューを表示し、イベントを閲覧可能
import Hero from "@/components/layout/hero";
import MainContainer from "./components/main-container";
import UpcomingEventCarousel from "@/components/layout/upcoming-event-carousel";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import BackgroundDecoration from "@/components/layout/background-decoration";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <BackgroundDecoration />
      <Hero />
      <UpcomingEventCarousel />
      <MainContainer />
      <Footer />
    </>
  );
}
