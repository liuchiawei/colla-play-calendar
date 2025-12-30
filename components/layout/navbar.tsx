"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import Link from "next/link";
import { Calendar, Settings, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/widget/theme-toggle";

export default function Navbar() {
  const [isVisible, setIsVisible] = useState(() => {
    // Avoid initial flash on hydration; on the client we can read scroll position.
    if (typeof window === "undefined") return false;
    return window.scrollY > 0;
  });

  const lastVisibleRef = useRef(isVisible);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      // Throttle to one update per animation frame.
      if (rafIdRef.current != null) return;

      rafIdRef.current = window.requestAnimationFrame(() => {
        rafIdRef.current = null;
        const nextVisible = window.scrollY > 0;

        // Only update state on threshold crossing to minimize re-renders.
        if (nextVisible === lastVisibleRef.current) return;
        lastVisibleRef.current = nextVisible;
        setIsVisible(nextVisible);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Sync immediately in case the user loads mid-scroll (e.g., refresh).
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafIdRef.current != null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  return (
    <motion.header
      initial={false}
      animate={isVisible ? "visible" : "hidden"}
      variants={{
        visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
        hidden: { opacity: 0, y: -20, transition: { duration: 0.15 } },
      }}
      className={[
        "fixed top-0 left-0 right-0 z-40 border-b border-border/50 bg-background/50 backdrop-blur-sm",
        isVisible ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
      aria-hidden={!isVisible}
    >
      <div className="mx-auto px-4 py-4 flex items-center justify-between">
        {/* ロゴ */}
        <div className="flex items-baseline gap-3 select-none">
          <Link href="/" className="text-xl font-bold tracking-wider">
            Colla Play
          </Link>
          <h2 className="text-sm text-muted-foreground/70 text-shadow/sm tracking-wider">
            可能存在的遊樂園
          </h2>
        </div>

        {/* ナビゲーション */}
        <nav className="flex items-center gap-2">
          <Link href="/calendar">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 hover:bg-primary/10 hover:text-primary"
            >
              <Calendar className="size-4" />
              <span className="hidden md:inline">活動行事曆</span>
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 hover:bg-primary/10 hover:text-primary"
            >
              <Settings className="size-4" />
              <span className="hidden md:inline">後台管理</span>
            </Button>
          </Link>
          <ThemeToggle className="hover:text-primary hover:bg-primary/10" />
        </nav>
      </div>
    </motion.header>
  );
}
