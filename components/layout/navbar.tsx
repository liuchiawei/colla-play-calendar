"use client";

import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import Link from "next/link";
import { Calendar, Settings, Sparkles } from "lucide-react";

export default function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-40 border-b border-border/50 bg-background/50 backdrop-blur-sm"
    >
      <div className="mx-auto px-4 py-4 flex items-center justify-between">
        {/* ロゴ */}
        <Link href="/" className="flex items-center gap-3 group">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-wider">
            Colla Play
          </h1>
          <p className="text-xs text-muted-foreground -mt-0.5 tracking-wider">
            可能存在的遊樂園
          </p>
        </div>
        </Link>

        {/* ナビゲーション */}
        <nav className="flex items-center gap-2">
          <Link href="/calendar">
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            活動行事曆
          </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">後台管理</span>
            </Button>
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
