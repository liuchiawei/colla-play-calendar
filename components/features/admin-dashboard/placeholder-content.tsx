"use client";

// Placeholder Content Component
// 佔位內容組件 - 用於未完成頁面的佔位顯示

import { motion } from "motion/react";
import * as Icons from "lucide-react";

interface PlaceholderContentProps {
  iconName: string;
  title: string;
  description?: string;
}

export function PlaceholderContent({
  iconName,
  title,
  description = "此功能正在開發中，敬請期待",
}: PlaceholderContentProps) {
  const Icon = Icons[iconName as keyof typeof Icons] as any;
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="text-center max-w-md px-6"
      >
        <motion.div variants={itemVariants} className="mb-6">
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex rounded-3xl bg-gradient-to-br from-accent to-primary p-8 shadow-2xl shadow-accent/30"
          >
            <Icon className="h-16 w-16 text-white" strokeWidth={1.5} />
          </motion.div>
        </motion.div>

        <motion.h2
          variants={itemVariants}
          className="font-display font-extrabold text-4xl mb-3 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent"
        >
          {title}
        </motion.h2>

        <motion.p
          variants={itemVariants}
          className="text-lg text-muted-foreground mb-6"
        >
          {description}
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20"
        >
          <div className="flex gap-1">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
              className="w-2 h-2 rounded-full bg-gradient-to-r from-accent to-primary"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
              className="w-2 h-2 rounded-full bg-gradient-to-r from-accent to-primary"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
              className="w-2 h-2 rounded-full bg-gradient-to-r from-accent to-primary"
            />
          </div>
          <span className="text-sm font-medium text-accent-foreground">
            Coming Soon
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
