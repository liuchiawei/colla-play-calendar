"use client";

// カテゴリ管理コンポーネント
// カテゴリの追加・編集・削除を行う

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DEFAULT_CATEGORY_COLORS } from "@/lib/types";
import type { Category, CategoryInput } from "@/lib/types";

interface CategoryManagerProps {
  categories: Category[];
  onAdd: (data: CategoryInput) => Promise<void>;
  onUpdate: (id: string, data: CategoryInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CategoryManager({
  categories,
  onAdd,
  onUpdate,
  onDelete,
}: CategoryManagerProps) {
  // 編集中のカテゴリID
  const [editingId, setEditingId] = React.useState<string | null>(null);
  // 新規追加モード
  const [isAdding, setIsAdding] = React.useState(false);
  // フォームデータ
  const [formData, setFormData] = React.useState<CategoryInput>({
    name: "",
    color: DEFAULT_CATEGORY_COLORS[0],
  });
  // 削除確認ダイアログ
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  // ローディング状態
  const [isLoading, setIsLoading] = React.useState(false);

  // 編集開始
  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setFormData({ name: category.name, color: category.color });
    setIsAdding(false);
  };

  // 新規追加開始
  const startAdding = () => {
    setIsAdding(true);
    setEditingId(null);
    // 未使用の色を選択
    const usedColors = categories.map((c) => c.color);
    const availableColor =
      DEFAULT_CATEGORY_COLORS.find((c) => !usedColors.includes(c)) ||
      DEFAULT_CATEGORY_COLORS[0];
    setFormData({ name: "", color: availableColor });
  };

  // キャンセル
  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ name: "", color: DEFAULT_CATEGORY_COLORS[0] });
  };

  // 保存
  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setIsLoading(true);
    try {
      if (isAdding) {
        await onAdd(formData);
      } else if (editingId) {
        await onUpdate(editingId, formData);
      }
      cancelEdit();
    } finally {
      setIsLoading(false);
    }
  };

  // 削除確認
  const handleDelete = async () => {
    if (!deleteId) return;

    setIsLoading(true);
    try {
      await onDelete(deleteId);
      setDeleteId(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">活動類型管理</h3>
        <Button
          size="sm"
          onClick={startAdding}
          disabled={isAdding}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          新增類型
        </Button>
      </div>

      {/* カテゴリリスト */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {/* 新規追加フォーム */}
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-dashed"
            >
              {/* 色選択 */}
              <div className="flex gap-1">
                {DEFAULT_CATEGORY_COLORS.slice(0, 6).map((color) => (
                  <button
                    aria-label="color-selector"
                    title={color}
                    key={color}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, color }))}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      formData.color === color
                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="輸入類型名稱"
                className="flex-1"
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleSave}
                disabled={!formData.name.trim() || isLoading}
              >
                <Check className="h-4 w-4 text-green-500" />
              </Button>
              <Button size="icon" variant="ghost" onClick={cancelEdit}>
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </motion.div>
          )}

          {/* 既存カテゴリ */}
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-2 p-3 bg-card rounded-lg border hover:border-primary/30 transition-colors"
            >
              {editingId === category.id ? (
                // 編集モード
                <>
                  <div className="flex gap-1">
                    {DEFAULT_CATEGORY_COLORS.slice(0, 6).map((color) => (
                      <button
                        aria-label="color-selector"
                        title={color}
                        key={color}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, color }))
                        }
                        className={`w-6 h-6 rounded-full transition-transform ${
                          formData.color === color
                            ? "ring-2 ring-offset-2 ring-primary scale-110"
                            : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="flex-1"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSave}
                    disabled={!formData.name.trim() || isLoading}
                  >
                    <Check className="h-4 w-4 text-green-500" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={cancelEdit}>
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </>
              ) : (
                // 表示モード
                <>
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="flex-1 font-medium">{category.name}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEditing(category)}
                    className="h-8 w-8"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setDeleteId(category.id)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 空の状態 */}
        {categories.length === 0 && !isAdding && (
          <div className="text-center py-8 text-muted-foreground">
            <p>尚無活動類型</p>
            <p className="text-sm">點擊「新增類型」來建立第一個類型</p>
          </div>
        )}
      </div>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除此類型？</AlertDialogTitle>
            <AlertDialogDescription>
              刪除後，使用此類型的活動將變為「無分類」。此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              確定刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
