"use client";

// Modern Admin Sidebar Component
// 現代化管理後台側邊欄 - 動畫導航與活動狀態

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { dashboardNewNavigation } from "@/lib/config-dashboard-new";
import { STORE_MESSAGES } from "@/lib/message";

export function AdminSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="bg-primary py-6">
        <div className="space-y-2">
          <h2 className="font-display font-bold text-lg text-white">
            {state === "expanded"
              ? STORE_MESSAGES.name
              : STORE_MESSAGES.name.charAt(0)}
          </h2>
          {state === "expanded" && (
            <p className="text-xs text-muted">
              {STORE_MESSAGES.subtitle}
            </p>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarMenu className="gap-2">
          {dashboardNewNavigation.map((item) => {
            // Root path /dashboard-new must match exactly so sub-routes don't highlight 總覽
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard-new" &&
                pathname.startsWith(item.href + "/"));

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  className={`
                    group relative overflow-hidden transition-all duration-300
                    ${
                      isActive
                        ? "bg-gradient-to-r from-accent to-primary text-white shadow-lg shadow-accent/50 hover:shadow-xl hover:shadow-accent/60"
                        : "hover:text-foreground hover:bg-accent/10 dark:hover:bg-accent/5"
                    }
                  `}
                >
                  <Link href={item.href}>
                    <motion.div
                      className="flex items-center gap-3 w-full"
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <item.icon
                          className={`h-4 w-4 ${isActive ? "text-white" : ""}`}
                        />
                      </motion.div>
                      <span
                        className={`font-medium ${isActive ? "text-white" : ""}`}
                      >
                        {item.label}
                      </span>
                    </motion.div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="text-xs text-center text-muted-foreground">
          <p className="font-display font-semibold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
            CollaPlay Admin
          </p>
          <p className="mt-1">v2.0</p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
