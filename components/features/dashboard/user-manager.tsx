"use client";

// 會員管理 UI 組件
// 使用 shadcn 組件實現用戶列表展示、搜尋、篩選等功能

import * as React from "react";
import { motion } from "motion/react";
import { Search, Filter, Users, Shield, User, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserWithAdmin } from "@/lib/types";
import { formatDate } from "@/lib/date-utils";

interface UserManagerProps {
  // 用戶列表
  users: UserWithAdmin[];
  // 載入狀態
  isLoading: boolean;
  // 搜尋關鍵字
  searchQuery: string;
  // 搜尋關鍵字變更處理
  onSearchChange: (query: string) => void;
  // 篩選條件（all, admin, user）
  filter: string;
  // 篩選條件變更處理
  onFilterChange: (filter: string) => void;
  // 更新管理員狀態處理
  onToggleAdmin: (userId: string, isAdmin: boolean) => Promise<void>;
  // 重新載入數據
  onRefresh: () => void;
  // 當前用戶 ID（用於防止移除自己的管理員權限）
  currentUserId?: string;
}

export function UserManager({
  users,
  isLoading,
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  onToggleAdmin,
  onRefresh,
  currentUserId,
}: UserManagerProps) {
  // 切換管理員狀態
  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    // 防止移除自己的管理員權限
    if (currentIsAdmin && userId === currentUserId) {
      return;
    }
    await onToggleAdmin(userId, !currentIsAdmin);
  };

  return (
    <div className="space-y-4">
      {/* 搜尋與篩選欄 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋用戶姓名或 Email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="篩選用戶" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部用戶</SelectItem>
            <SelectItem value="admin">僅管理員</SelectItem>
            <SelectItem value="user">僅一般用戶</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
        </Button>
      </motion.div>

      {/* 用戶表格 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="border rounded-lg overflow-hidden bg-card"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">用戶</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>註冊時間</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead className="text-right">管理員</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // 載入骨架
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[200px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-[50px] ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              // 空狀態
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">目前沒有用戶</p>
                    <p className="text-sm">
                      {searchQuery || filter !== "all"
                        ? "嘗試調整搜尋條件"
                        : "目前系統中沒有註冊用戶"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              // 用戶列表
              users.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="group hover:bg-muted/50"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name || user.email}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <span className="truncate max-w-[150px]">
                        {user.name || "未設定姓名"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    {user.emailVerified ? (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400">
                        已驗證
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                        未驗證
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.isAdmin && (
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary"
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          管理員
                        </Badge>
                      )}
                      <Switch
                        checked={user.isAdmin}
                        onCheckedChange={() =>
                          handleToggleAdmin(user.id, user.isAdmin)
                        }
                        disabled={
                          user.isAdmin && user.id === currentUserId
                        }
                        aria-label={`切換 ${user.name || user.email} 的管理員狀態`}
                      />
                    </div>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>

      {/* 統計信息 */}
      {!isLoading && users.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          共 {users.length} 個用戶
        </div>
      )}
    </div>
  );
}

