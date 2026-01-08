"use client";

// Dashboard 內容組件
// 根據當前選中的 sidebar 項目渲染對應的內容組件

import * as React from "react";
import { EventsManagement } from "@/components/features/dashboard/events-management";
import { CategoriesManagement } from "@/components/features/dashboard/categories-management";
import { UsersManagement } from "@/components/features/dashboard/users-management";
import type { DashboardTab } from "@/lib/config";
import type {
  EventWithCategory,
  Category,
  CategoryInput,
  EventStatus,
} from "@/lib/types";

interface DashboardContentProps {
  activeTab: DashboardTab;
  // Events management props
  events: EventWithCategory[];
  categories: Category[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterCategory: string;
  onFilterCategoryChange: (category: string) => void;
  onRefresh: () => void;
  onEdit: (event: EventWithCategory) => void;
  onDelete: (eventId: string) => void;
  onViewRegistrations: (eventId: string) => void;
  onReview?: (eventId: string, status: EventStatus) => Promise<void>;
  // Categories management props
  onCategoryAdd: (data: CategoryInput) => Promise<void>;
  onCategoryUpdate: (id: string, data: CategoryInput) => Promise<void>;
  onCategoryDelete: (id: string) => Promise<void>;
}

export function DashboardContent({
  activeTab,
  events,
  categories,
  isLoading,
  searchQuery,
  onSearchChange,
  filterCategory,
  onFilterCategoryChange,
  onRefresh,
  onEdit,
  onDelete,
  onViewRegistrations,
  onReview,
  onCategoryAdd,
  onCategoryUpdate,
  onCategoryDelete,
}: DashboardContentProps) {
  switch (activeTab) {
    case "events":
      return (
        <EventsManagement
          events={events}
          categories={categories}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          filterCategory={filterCategory}
          onFilterCategoryChange={onFilterCategoryChange}
          onRefresh={onRefresh}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewRegistrations={onViewRegistrations}
          onReview={onReview}
        />
      );
    case "categories":
      return (
        <CategoriesManagement
          categories={categories}
          onAdd={onCategoryAdd}
          onUpdate={onCategoryUpdate}
          onDelete={onCategoryDelete}
        />
      );
    case "users":
      return <UsersManagement />;
    default:
      return null;
  }
}
