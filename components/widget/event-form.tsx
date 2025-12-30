"use client";

// イベントフォームコンポーネント
// 新規作成・編集両方に対応するフォーム

import * as React from "react";
import { motion } from "motion/react";
import { Calendar, Clock, MapPin, User, Link2, Ticket, Image, FileText, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatForDateTimeInput } from "@/lib/date-utils";
import type { EventWithCategory, EventInput, Category } from "@/lib/types";

interface EventFormProps {
  event?: EventWithCategory | null;
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EventInput) => Promise<void>;
  isLoading?: boolean;
}

export function EventForm({
  event,
  categories,
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: EventFormProps) {
  const isEditing = !!event;

  // フォームの状態
  const [formData, setFormData] = React.useState<EventInput>({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    organizer: "",
    imageUrl: "",
    registrationUrl: "",
    price: "",
    categoryId: "",
  });

  // イベントデータでフォームを初期化
  React.useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || "",
        startTime: formatForDateTimeInput(event.startTime),
        endTime: formatForDateTimeInput(event.endTime),
        location: event.location || "",
        organizer: event.organizer || "",
        imageUrl: event.imageUrl || "",
        registrationUrl: event.registrationUrl || "",
        price: event.price || "",
        categoryId: event.categoryId || "",
      });
    } else {
      // 新規作成時は現在時刻をデフォルトに
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      setFormData({
        title: "",
        description: "",
        startTime: formatForDateTimeInput(now),
        endTime: formatForDateTimeInput(oneHourLater),
        location: "",
        organizer: "",
        imageUrl: "",
        registrationUrl: "",
        price: "",
        categoryId: "",
      });
    }
  }, [event, open]);

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  // 入力変更ハンドラ
  const handleChange = (
    field: keyof EventInput,
    value: string | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEditing ? "編輯活動" : "新增活動"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* タイトル */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              活動名稱 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="輸入活動名稱"
              required
            />
          </div>

          {/* 日時 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                開始時間 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => handleChange("startTime", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                結束時間 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => handleChange("endTime", e.target.value)}
                required
              />
            </div>
          </div>

          {/* カテゴリ */}
          <div className="space-y-2">
            <Label htmlFor="category" className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              活動類型
            </Label>
            <Select
              value={formData.categoryId || "none"}
              onValueChange={(value) =>
                handleChange("categoryId", value === "none" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="選擇活動類型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">無分類</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 場所・主催者 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                活動地點
              </Label>
              <Input
                id="location"
                value={formData.location || ""}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="輸入活動地點"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizer" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                主辦人
              </Label>
              <Input
                id="organizer"
                value={formData.organizer || ""}
                onChange={(e) => handleChange("organizer", e.target.value)}
                placeholder="輸入主辦人"
              />
            </div>
          </div>

          {/* 料金・報名連結 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-muted-foreground" />
                票價/費用
              </Label>
              <Input
                id="price"
                value={formData.price || ""}
                onChange={(e) => handleChange("price", e.target.value)}
                placeholder="例：免費、$500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationUrl" className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                報名連結
              </Label>
              <Input
                id="registrationUrl"
                type="url"
                value={formData.registrationUrl || ""}
                onChange={(e) => handleChange("registrationUrl", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* 画像URL */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="flex items-center gap-2">
              <Image className="h-4 w-4 text-muted-foreground" />
              活動圖片網址
            </Label>
            <Input
              id="imageUrl"
              type="url"
              value={formData.imageUrl || ""}
              onChange={(e) => handleChange("imageUrl", e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* 説明 */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              活動說明
            </Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="輸入活動詳細說明..."
              rows={4}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "處理中..." : isEditing ? "儲存變更" : "新增活動"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

