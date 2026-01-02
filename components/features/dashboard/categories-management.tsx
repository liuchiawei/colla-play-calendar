"use client";

// 類型管理組件
// 包裝 CategoryManager 組件

import * as React from "react";
import { motion } from "motion/react";
import { CategoryManager } from "@/components/features/dashboard/category-manager";
import type { Category, CategoryInput } from "@/lib/types";

interface CategoriesManagementProps {
  categories: Category[];
  onAdd: (data: CategoryInput) => Promise<void>;
  onUpdate: (id: string, data: CategoryInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CategoriesManagement({
  categories,
  onAdd,
  onUpdate,
  onDelete,
}: CategoriesManagementProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto bg-card border rounded-lg p-6"
    >
      <CategoryManager
        categories={categories}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </motion.div>
  );
}


