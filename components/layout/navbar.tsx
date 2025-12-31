"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "motion/react";
import Link from "next/link";
import { Calendar, Settings, LogIn } from "lucide-react";
import { ThemeToggle } from "@/components/widget/theme-toggle";
import { UserProfileSheet } from "@/components/widget/user-profile-sheet";
import { useAuthStore } from "@/lib/stores/auth-store";
import { usePathname } from "next/navigation";

export default function Navbar() {
  // 從 auth store 讀取管理員狀態和用戶信息
  const { isAdmin, initialized, user, fetchUser } = useAuthStore();
  const pathname = usePathname();

  // 調試信息（僅在開發環境）
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("[Navbar] Auth state:", {
        initialized,
        hasUser: !!user,
        userEmail: user?.email,
        isAdmin,
      });
    }
  }, [initialized, user, isAdmin]);
  const [isVisible, setIsVisible] = useState(() => {
    // Avoid initial flash on hydration; on the client we can read scroll position.
    if (typeof window === "undefined") return false;
    return window.scrollY > 0;
  });
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);

  const lastVisibleRef = useRef(isVisible);
  const rafIdRef = useRef<number | null>(null);

  // 監聽路由變化，重新獲取用戶信息（確保登入後狀態更新）
  useEffect(() => {
    if (initialized && pathname) {
      // 在路由變化時重新獲取用戶信息，確保狀態同步
      fetchUser();
    }
  }, [pathname, initialized, fetchUser]);

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
          {/* 僅管理員可見 Dashboard 連結 */}
          {initialized && isAdmin && (
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
          )}
          <ThemeToggle className="hover:text-primary hover:bg-primary/10" />

          {/* 登入/頭像區塊 */}
          {initialized && (
            <div className="flex items-center">
              {user ? (
                <button
                  onClick={() => setIsProfileSheetOpen(true)}
                  className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label="開啟個人資料"
                >
                  <Avatar className="size-8 cursor-pointer hover:opacity-80 transition-opacity">
                    <AvatarImage
                      src={user.image || undefined}
                      alt={user.name || user.email}
                    />
                    <AvatarFallback className="text-xs font-semibold">
                      {user.name
                        ? user.name.charAt(0).toUpperCase()
                        : user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              ) : (
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 hover:bg-primary/10 hover:text-primary"
                  >
                    <LogIn className="size-4" />
                    <span className="hidden md:inline">登入</span>
                  </Button>
                </Link>
              )}
            </div>
          )}
        </nav>
      </div>

      {/* 個人資料 Sheet */}
      {user && (
        <UserProfileSheet
          open={isProfileSheetOpen}
          onOpenChange={setIsProfileSheetOpen}
        />
      )}
    </motion.header>
  );
}
