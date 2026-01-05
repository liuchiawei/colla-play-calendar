import type { Metadata } from "next";
import { Roboto, Roboto_Mono, Noto_Sans_TC, Noto_Serif_TC } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import BackgroundDecoration from "@/components/layout/background-decoration";
import { AuthProvider } from "@/components/providers/auth-provider";

// フォント設定
const robotoSans = Roboto({
  variable: "--font-roboto-sans",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

const notoSans = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
});

const notoSerif = Noto_Serif_TC({
  variable: "--font-noto-serif-tc",
  subsets: ["latin"],
});

// メタデータ設定
export const metadata: Metadata = {
  title: "CollaPlay | 可能存在的遊樂園",
  description:
    "CollaPlay 共同工作空間/展演空間/實體社群基地的週間活動行事曆。探索工作坊、講座、展演等精彩活動！",
  keywords: [
    "CollaPlay",
    "可能存在的遊樂園",
    "共同工作空間",
    "展演空間",
    "活動行事曆",
    "工作坊",
    "講座",
  ],
  authors: [{ name: "CollaPlay" }],
  openGraph: {
    title: "CollaPlay 可能存在的遊樂園",
    description: "探索 CollaPlay 的精彩活動！",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body
        className={`${robotoSans.variable} ${notoSerif.variable} ${notoSans.variable} ${robotoMono.variable} antialiased font-sans min-h-screen relative`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider />
          <BackgroundDecoration />
          <Navbar />
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
