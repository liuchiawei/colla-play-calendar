"use client";

// Overview Stats Component
// 總覽統計組件 - 當月場租、洽談中/已確認專案、今日預定

import { motion, useReducedMotion } from "motion/react";
import { Banknote, MessageCircle, CheckCircle, CalendarDays } from "lucide-react";
import { AnimatedCard } from "./animated-card";
import { DASHBOARD_OVERVIEW } from "@/lib/message";
import type { OverviewStatsData } from "@/lib/types/project";

export type { OverviewStatsData };

const CURRENCY_FORMATTER = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
});

const INTEGER_FORMATTER = new Intl.NumberFormat("zh-TW", {
  maximumFractionDigits: 0,
});

const STATS_CONFIG = [
  {
    id: "monthly-rental",
    labelKey: "statsMonthlyRentalLabel" as const,
    descriptionKey: "statsMonthlyRentalDescription" as const,
    format: "currency" as const,
    valueKey: "monthlyRentalIncome" as const,
    icon: Banknote,
    color: "from-accent to-primary",
  },
  {
    id: "negotiating",
    labelKey: "statsNegotiatingLabel" as const,
    descriptionKey: "statsNegotiatingDescription" as const,
    format: "number" as const,
    valueKey: "negotiatingCount" as const,
    icon: MessageCircle,
    color: "from-chart-2 to-chart-3",
  },
  {
    id: "confirmed",
    labelKey: "statsConfirmedLabel" as const,
    descriptionKey: "statsConfirmedDescription" as const,
    format: "number" as const,
    valueKey: "confirmedCount" as const,
    icon: CheckCircle,
    color: "from-chart-5 to-accent",
  },
  {
    id: "today-reservations",
    labelKey: "statsTodayReservationsLabel" as const,
    descriptionKey: "statsTodayReservationsDescription" as const,
    format: "number" as const,
    valueKey: "todayReservations" as const,
    icon: CalendarDays,
    color: "from-chart-4 to-chart-2",
  },
] as const;

const MOCK_STATS: OverviewStatsData = {
  monthlyRentalIncome: 0,
  negotiatingCount: 2,
  confirmedCount: 4,
  todayReservations: 0,
};

function formatStatValue(
  data: OverviewStatsData,
  valueKey: keyof OverviewStatsData,
  format: "currency" | "number"
): string {
  const value = data[valueKey];
  if (format === "currency") return CURRENCY_FORMATTER.format(value);
  return INTEGER_FORMATTER.format(value);
}

export function OverviewStats({ data = MOCK_STATS }: { data?: OverviewStatsData }) {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    show: { opacity: 1, y: 0 },
  };

  const valueTransition = shouldReduceMotion
    ? { duration: 0 }
    : { delay: 0.2, duration: 0.5, ease: "backOut" as const };

  return (
    <motion.section
      aria-label="總覽統計"
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {STATS_CONFIG.map((stat) => {
        const labelId = `overview-stat-${stat.id}-label`;
        const descId = `overview-stat-${stat.id}-desc`;
        const value = formatStatValue(data, stat.valueKey, stat.format);
        const label = DASHBOARD_OVERVIEW[stat.labelKey];
        const description = DASHBOARD_OVERVIEW[stat.descriptionKey];
        const Icon = stat.icon;

        return (
          <motion.article
            key={stat.id}
            variants={itemVariants}
            aria-labelledby={labelId}
            aria-describedby={descId}
          >
            <AnimatedCard gradient>
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`rounded-xl bg-primary p-3 shadow-lg`}
                  aria-hidden
                >
                  <Icon className="h-6 w-6 text-white" strokeWidth={2} aria-hidden />
                </div>
              </div>

              <div className="min-w-0">
                <p id={labelId} className="text-sm text-muted-foreground mb-1 text-balance">
                  {label}
                </p>
                <motion.p
                  initial={shouldReduceMotion ? false : { scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={valueTransition}
                  className="font-display font-bold text-xl tabular-nums text-primary"
                >
                  {value}
                </motion.p>
                <p id={descId} className="text-xs text-muted-foreground mt-1">
                  {description}
                </p>
              </div>
            </AnimatedCard>
          </motion.article>
        );
      })}
    </motion.section>
  );
}
