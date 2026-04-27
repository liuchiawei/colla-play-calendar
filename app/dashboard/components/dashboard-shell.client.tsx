"use client";

// Dashboard Shell Component
// 儀表板外殼組件 - 內容包裝器與動畫

import { motion } from "motion/react";
import { SidebarInset } from "@/components/ui/sidebar";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <SidebarInset>
      <motion.div
        initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col min-h-screen"
      >
        {children}
      </motion.div>
    </SidebarInset>
  );
}
