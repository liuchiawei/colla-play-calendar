"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/lib/stores/auth-store";
import { authClient } from "@/lib/auth-client";
import { Home, Calendar, User, LogIn, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavSheetProps {
  children: React.ReactNode;
}

export function NavSheet({ children }: NavSheetProps) {
  const { user, isAdmin, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      // 清除快取
      await fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["user-auth"] }),
      }).catch(() => {
        // 忽略錯誤，繼續登出流程
      });

      // 執行登出
      await authClient.signOut();

      // 清除 store 狀態
      logout();

      // 導航到登入頁面
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
      // 即使出錯也清除本地狀態並導航
      logout();
      router.push("/login");
    }
  };

  const navLinks = [
    { href: "/", label: "首頁", icon: Home },
    { href: "/calendar", label: "活動行事曆", icon: Calendar },
    ...(user ? [{ href: "/profile", label: "個人資料", icon: User }] : []),
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <div className="flex flex-col h-full">
          {/* SheetHeader */}
          <SheetHeader className="pb-4">
            {user ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarImage
                      src={user.image || undefined}
                      alt={user.name || user.email}
                    />
                    <AvatarFallback className="text-sm font-semibold">
                      {user.name
                        ? user.name.charAt(0).toUpperCase()
                        : user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-lg font-semibold truncate">
                      {user.name || "用戶"}
                    </SheetTitle>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <Badge variant="default" className="w-fit">
                    管理員
                  </Badge>
                )}
              </div>
            ) : (
              <div>
                <SheetTitle>歡迎</SheetTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  請登入以使用完整功能
                </p>
              </div>
            )}
          </SheetHeader>

          <Separator />

          {/* SheetContent - Navigation Links */}
          <div className="flex-1 py-4 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Button
                  key={link.href}
                  asChild
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive && "bg-secondary"
                  )}
                >
                  <Link href={link.href}>
                    <Icon className="size-4" />
                    {link.label}
                  </Link>
                </Button>
              );
            })}
          </div>

          <Separator />

          {/* SheetFooter */}
          <SheetFooter className="pt-4">
            {user ? (
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full gap-2"
              >
                <LogOut className="size-4" />
                登出
              </Button>
            ) : (
              <Button asChild variant="default" className="w-full gap-2">
                <Link href="/login">
                  <LogIn className="size-4" />
                  登入
                </Link>
              </Button>
            )}
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
