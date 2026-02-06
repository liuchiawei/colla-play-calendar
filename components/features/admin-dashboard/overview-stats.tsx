"use client";

// Overview Stats Component
// 總覽統計組件 - 統計卡片網格與動畫

import { motion } from "motion/react";
import { TrendingUp, Users, Calendar, Activity } from "lucide-react";
import { AnimatedCard } from "./animated-card";

const stats = [
  {
    icon: TrendingUp,
    label: "總活動數",
    value: "128",
    change: "+12%",
    color: "from-accent to-primary",
  },
  {
    icon: Users,
    label: "活躍用戶",
    value: "1,842",
    change: "+8%",
    color: "from-chart-2 to-chart-3",
  },
  {
    icon: Calendar,
    label: "本月活動",
    value: "24",
    change: "+16%",
    color: "from-chart-5 to-accent",
  },
  {
    icon: Activity,
    label: "參與率",
    value: "87%",
    change: "+5%",
    color: "from-chart-4 to-chart-2",
  },
];

export function OverviewStats() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {stats.map((stat) => (
        <motion.div key={stat.label} variants={itemVariants}>
          <AnimatedCard gradient>
            <div className="flex items-start justify-between mb-4">
              <div
                className={`rounded-xl bg-gradient-to-br ${stat.color} p-3 shadow-lg`}
              >
                <stat.icon className="h-6 w-6 text-white" strokeWidth={2} />
              </div>
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100/50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                {stat.change}
              </span>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <motion.p
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5, ease: "backOut" }}
                className={`font-display font-black text-4xl bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}
              >
                {stat.value}
              </motion.p>
            </div>
          </AnimatedCard>
        </motion.div>
      ))}
    </motion.div>
  );
}
