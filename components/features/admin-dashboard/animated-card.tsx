"use client";

// Animated Card Component
// 動畫卡片組件 - 玻璃態效果與懸停動畫

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
  hover?: boolean;
}

export function AnimatedCard({
  children,
  className,
  gradient = false,
  hover = true,
}: AnimatedCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.02 } : undefined}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6",
        "backdrop-blur-2xl bg-card/50",
        "border border-border",
        "shadow-xl hover:shadow-2xl",
        gradient && "bg-gradient-to-br from-accent/10 to-primary/10",
        "transition-all duration-300",
        className
      )}
    >
      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

      {/* Hover gradient border */}
      {hover && (
        <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-accent/40 to-primary/40 p-[2px]">
          <div className="h-full w-full rounded-2xl bg-background" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
