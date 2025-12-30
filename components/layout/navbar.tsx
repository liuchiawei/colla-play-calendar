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
      className="relative z-10 border-b border-border/40 bg-background/80 backdrop-blur-md"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* ロゴ */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="relative"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -inset-1 rounded-xl bg-primary/20 -z-10"
              />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-gradient font-[var(--font-outfit)]">
                CollaPlay
              </h1>
              <p className="text-xs text-muted-foreground -mt-0.5">
                可能存在的遊樂園
              </p>
            </div>
          </Link>

          {/* ナビゲーション */}
          <nav className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              週間行事曆
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">後台管理</span>
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </motion.header>
  );
}
