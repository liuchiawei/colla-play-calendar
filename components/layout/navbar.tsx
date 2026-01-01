"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, Settings, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/widget/theme-toggle";
import { NavSheet } from "@/components/layout/nav-sheet";
import { useAuthStore } from "@/lib/stores/auth-store";
import { usePathname } from "next/navigation";

export default function Navbar() {
  // 從 auth store 讀取管理員狀態和用戶信息
  const { isAdmin, initialized, user, fetchUser } = useAuthStore();
  const pathname = usePathname();

  // 監聽路由變化，重新獲取用戶信息（確保登入後狀態更新）
  useEffect(() => {
    if (initialized && pathname) {
      // 在路由變化時重新獲取用戶信息，確保狀態同步
      fetchUser();
    }
  }, [pathname, initialized, fetchUser]);

  return (
    <nav className="fixed top-4 right-4 z-40 flex items-center gap-2">
      <ThemeToggle className="hover:text-primary hover:bg-primary/10" />
      {/* Menu Button */}
      <NavSheet>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 hover:text-primary"
        >
          <Menu className="size-5" />
        </Button>
      </NavSheet>
    </nav>
  );
}
