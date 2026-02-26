import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import BackgroundDecoration from "@/components/layout/background-decoration";

export default function OtherPagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen relative">
      <BackgroundDecoration />
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
