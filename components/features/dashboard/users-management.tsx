"use client";

// 會員管理組件
// 包裝 UserManagementClient 組件

import * as React from "react";
import { motion } from "motion/react";
import UserManagementClient from "@/app/dashboard/components/user-management.client";

export function UsersManagement() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <UserManagementClient />
    </motion.div>
  );
}

