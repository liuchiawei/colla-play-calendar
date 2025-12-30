import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Outfit } from "next/font/google";
import "./globals.css";

// フォント設定
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// メタデータ設定
export const metadata: Metadata = {
  title: "CollaPlay 可能存在的遊樂園 | 週間活動行事曆",
  description: "CollaPlay 共同工作空間/展演空間/實體社群基地的週間活動行事曆。探索工作坊、講座、展演等精彩活動！",
  keywords: ["CollaPlay", "可能存在的遊樂園", "共同工作空間", "展演空間", "活動行事曆", "工作坊", "講座"],
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
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
