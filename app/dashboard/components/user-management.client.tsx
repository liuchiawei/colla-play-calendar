"use client";

// 會員管理數據邏輯組件
// 處理用戶列表的獲取、搜尋、篩選、更新管理員狀態等邏輯

import * as React from "react";
import { UserManager } from "@/components/widget/user-manager";
import type { UserWithAdmin, UserListResponse } from "@/lib/types";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function UserManagementClient() {
  // 用戶列表數據
  const [users, setUsers] = React.useState<UserWithAdmin[]>([]);
  // 載入狀態
  const [isLoading, setIsLoading] = React.useState(true);
  // 搜尋關鍵字
  const [searchQuery, setSearchQuery] = React.useState("");
  // 篩選條件
  const [filter, setFilter] = React.useState<string>("all");
  // 當前用戶信息（用於防止移除自己的管理員權限）
  const { user: currentUser } = useAuthStore();

  // 獲取用戶列表
  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // 構建查詢參數
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      if (filter !== "all") {
        params.append("filter", filter);
      }

      const response = await fetch(`/api/users?${params.toString()}`);
      const data = await response.json();

      if (data.success && data.data) {
        const userListResponse: UserListResponse = data.data;
        setUsers(userListResponse.users);
      } else {
        console.error("Failed to fetch users:", data.error);
        setUsers([]);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filter]);

  // 初始載入
  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 更新管理員狀態
  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin }),
      });

      const data = await response.json();

      if (data.success) {
        // 更新本地狀態
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, isAdmin } : user
          )
        );
      } else {
        console.error("Failed to update user:", data.error);
        alert(data.error || "更新失敗");
      }
    } catch (error) {
      console.error("Failed to update user:", error);
      alert("更新失敗，請再試一次");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <UserManager
        users={users}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filter={filter}
        onFilterChange={setFilter}
        onToggleAdmin={handleToggleAdmin}
        onRefresh={fetchUsers}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}

