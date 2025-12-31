"use client";

// 個人資料表單（Client Component）
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Profile, ProfileUpdateInput } from "@/lib/types";

// 個人資料表單驗證規則
const profileSchema = z.object({
  displayName: z.string().max(100).nullable().optional(),
  birthDate: z.string().nullable().optional(),
  gender: z
    .enum(["male", "female", "other", "unspecified"])
    .nullable()
    .optional(),
  occupation: z.string().max(200).nullable().optional(),
  education: z.string().max(200).nullable().optional(),
  skills: z.string().optional(), // 前端以字串（逗號分隔）處理
  bio: z.string().max(100).nullable().optional(),
  isPublic: z.boolean().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialProfile: Profile | null;
}

export default function ProfileForm({ initialProfile }: ProfileFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 設定初始值
  const defaultValues: ProfileFormValues = {
    displayName: initialProfile?.displayName ?? null,
    birthDate: initialProfile?.birthDate
      ? new Date(initialProfile.birthDate).toISOString().split("T")[0]
      : null,
    gender:
      (initialProfile?.gender as "male" | "female" | "other" | "unspecified") ??
      null,
    occupation: initialProfile?.occupation ?? null,
    education: initialProfile?.education ?? null,
    skills: initialProfile?.skills
      ? Array.isArray(initialProfile.skills)
        ? initialProfile.skills.join(", ")
        : String(initialProfile.skills)
      : "",
    bio: initialProfile?.bio ?? null,
    isPublic: initialProfile?.isPublic ?? false,
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  // 計算簡介字數
  const bioValue = form.watch("bio") || "";
  const bioLength = bioValue.length;

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      // 將技能字串轉換為陣列（逗號分隔）
      const skillsArray = data.skills
        ? data.skills
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
        : null;

      const updateData: ProfileUpdateInput = {
        displayName: data.displayName || null,
        birthDate: data.birthDate || null,
        gender: data.gender || null,
        occupation: data.occupation || null,
        education: data.education || null,
        skills: skillsArray,
        bio: data.bio || null,
        isPublic: data.isPublic ?? false,
      };

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "更新個人資料失敗");
        return;
      }

      // 更新成功後，結束編輯模式
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setError("更新個人資料失敗，請再試一次");
      console.error("Profile update error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>個人資料</CardTitle>
            <CardDescription>管理您的個人資料資訊</CardDescription>
          </div>
          <div className="flex gap-2">
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                編輯
              </Button>
            )}
            <Button variant="outline" onClick={handleSignOut}>
              登出
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>姓名</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="輸入姓名"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>生日</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>性別</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選擇性別" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">男性</SelectItem>
                        <SelectItem value="female">女性</SelectItem>
                        <SelectItem value="other">其他</SelectItem>
                        <SelectItem value="unspecified">不指定</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="occupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>職業</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="輸入職業"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="education"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>學歷</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="輸入學歷"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>技能</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="以逗號分隔輸入技能（例：JavaScript, React, TypeScript）"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>請以逗號分隔輸入多個技能</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>簡介（100 字以內）</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="輸入自我介紹（100 字以內）"
                        {...field}
                        value={field.value || ""}
                        maxLength={100}
                      />
                    </FormControl>
                    <FormDescription>{bioLength}/100 字</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">公開個人資料</FormLabel>
                      <FormDescription>
                        設定是否要將個人資料公開給其他使用者
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "儲存中..." : "儲存"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    form.reset(defaultValues);
                    setError(null);
                  }}
                >
                  取消
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                姓名
              </label>
              <p className="mt-1 text-base">
                {initialProfile?.displayName || "未設定"}
              </p>
            </div>

            <Separator />

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                生日
              </label>
              <p className="mt-1 text-base">
                {initialProfile?.birthDate
                  ? new Date(initialProfile.birthDate).toLocaleDateString(
                      "zh-TW"
                    )
                  : "未設定"}
              </p>
            </div>

            <Separator />

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                性別
              </label>
              <p className="mt-1 text-base">
                {initialProfile?.gender === "male"
                  ? "男性"
                  : initialProfile?.gender === "female"
                  ? "女性"
                  : initialProfile?.gender === "other"
                  ? "其他"
                  : initialProfile?.gender === "unspecified"
                  ? "不指定"
                  : "未設定"}
              </p>
            </div>

            <Separator />

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                職業
              </label>
              <p className="mt-1 text-base">
                {initialProfile?.occupation || "未設定"}
              </p>
            </div>

            <Separator />

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                學歷
              </label>
              <p className="mt-1 text-base">
                {initialProfile?.education || "未設定"}
              </p>
            </div>

            <Separator />

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                技能
              </label>
              <p className="mt-1 text-base">
                {initialProfile?.skills
                  ? Array.isArray(initialProfile.skills)
                    ? initialProfile.skills.join(", ")
                    : String(initialProfile.skills)
                  : "未設定"}
              </p>
            </div>

            <Separator />

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                簡介
              </label>
              <p className="mt-1 text-base whitespace-pre-wrap">
                {initialProfile?.bio || "未設定"}
              </p>
            </div>

            <Separator />

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                公開設定
              </label>
              <p className="mt-1 text-base">
                {initialProfile?.isPublic ? "公開" : "非公開"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
