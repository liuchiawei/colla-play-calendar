"use client";

// Page Header Component
// 頁面標題組件 - 動畫標題與側邊欄觸發器

import { motion } from "motion/react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  iconName?: string;
}

export function PageHeader({ title, description, iconName }: PageHeaderProps) {
  const Icon = iconName ? (Icons[iconName as keyof typeof Icons] as LucideIcon | undefined) : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border"
    >
      <div className="flex items-center gap-4 px-6 py-4">
        <SidebarTrigger className="hover:bg-accent/10" />

        <div className="flex items-center gap-3 flex-1">
          {Icon && (
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="rounded-xl bg-gradient-to-br from-accent to-primary p-3 shadow-lg shadow-accent/30"
            >
              <Icon className="h-6 w-6 text-white" />
            </motion.div>
          )}

          <div>
            <h1 className="font-display font-extrabold text-3xl bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
