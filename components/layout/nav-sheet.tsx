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
import { signOut } from "@/lib/services/auth/auth.service";
import { cn } from "@/lib/utils";
import { PAGE_LINKS } from "@/lib/config";
import { LogIn, LogOut } from "lucide-react";

interface NavSheetProps {
  children: React.ReactNode;
}

export function NavSheet({ children }: NavSheetProps) {
  const { user, isAdmin, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut({
      onLogout: logout,
      onNavigate: (path) => router.push(path),
      onRefresh: () => router.refresh(),
      cleanupOnError: true,
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <div className="flex flex-col h-full">
          {/* SheetHeader */}
          <SheetHeader className="pb-4">
            {isAdmin && (
              <Badge variant="default" className="w-fit">
                管理員
              </Badge>
            )}
            {user ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Link href="/profile">
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
                  </Link>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-lg font-semibold truncate">
                      {user.name || "用戶"}
                    </SheetTitle>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
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
          <div className="flex-1 p-4 space-y-2">
            {PAGE_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Button
                  key={link.href}
                  asChild
                  size="lg"
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 text-xl",
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
          {/* SheetFooter */}
          <SheetFooter>
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
