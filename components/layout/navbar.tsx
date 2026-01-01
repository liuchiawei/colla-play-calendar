"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { NavSheet } from "@/components/layout/nav-sheet";
import GlassSurface from "@/components/ui/glass-surface";
import { ThemeToggle } from "@/components/widget/theme-toggle";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

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
    <nav className="fixed top-4 right-4 z-40">
      <GlassSurface
        width="100%"
        height="100%"
        borderRadius={100}
        className=""
        contentClassName="flex-row py-1 px-2 gap-1"
      >
        <ThemeToggle className="hover:text-primary hover:bg-background/50" />
        {/* Menu Button */}
        <NavSheet>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:text-primary hover:bg-background/50"
          >
            <Menu className="size-4" />
          </Button>
        </NavSheet>
      </GlassSurface>
    </nav>
  );
}
