"use client";

// 個人資料表單（Client Component）
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { AvatarUpload } from "@/components/widget/avatar-upload";
import { useAuthStore } from "@/lib/stores/auth-store";
import { signOut } from "@/lib/services/auth/auth.service";
import type { Profile, ProfileUpdateInput, ProfileVisibility } from "@/lib/types";

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
  // 可見性設定
  visibility: z
    .object({
      displayName: z.boolean().optional(),
      birthDate: z.boolean().optional(),
      gender: z.boolean().optional(),
      occupation: z.boolean().optional(),
      education: z.boolean().optional(),
      skills: z.boolean().optional(),
      bio: z.boolean().optional(),
    })
    .optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialProfile: Profile | null;
}

export default function ProfileForm({ initialProfile }: ProfileFormProps) {
  const router = useRouter();
  const { user, fetchUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 解析 visibility（如果存在）
  const visibility =
    (initialProfile?.visibility as ProfileVisibility | null) || null;

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
    visibility: {
      displayName: visibility?.displayName ?? false,
      birthDate: visibility?.birthDate ?? false,
      gender: visibility?.gender ?? false,
      occupation: visibility?.occupation ?? false,
      education: visibility?.education ?? false,
      skills: visibility?.skills ?? false,
      bio: visibility?.bio ?? false,
    },
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

      // 構建 visibility 物件（只包含設為 true 的字段）
      const visibility: ProfileVisibility = {};
      if (data.visibility) {
        if (data.visibility.displayName) visibility.displayName = true;
        if (data.visibility.birthDate) visibility.birthDate = true;
        if (data.visibility.gender) visibility.gender = true;
        if (data.visibility.occupation) visibility.occupation = true;
        if (data.visibility.education) visibility.education = true;
        if (data.visibility.skills) visibility.skills = true;
        if (data.visibility.bio) visibility.bio = true;
      }

      const updateData: ProfileUpdateInput = {
        displayName: data.displayName || null,
        birthDate: data.birthDate || null,
        gender: data.gender || null,
        occupation: data.occupation || null,
        education: data.education || null,
        skills: skillsArray,
        bio: data.bio || null,
        visibility: Object.keys(visibility).length > 0 ? visibility : null,
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
    const { logout } = useAuthStore.getState();
    await signOut({
      onLogout: logout,
      onNavigate: (path) => router.push(path),
      onRefresh: () => router.refresh(),
    });
  };

  // 獲取字段的可見性狀態
  const getFieldVisibility = (fieldName: keyof ProfileVisibility): boolean => {
    return form.watch(`visibility.${fieldName}`) ?? false;
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

        {/* 頭像上傳區塊 */}
        <div className="mb-6 flex justify-center">
          <AvatarUpload
            currentAvatarUrl={user?.image}
            userName={user?.name || user?.email}
            onUploadSuccess={() => {
              fetchUser();
              router.refresh();
            }}
            size="lg"
          />
        </div>

        <Separator className="mb-6" />

        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 姓名 */}
              <div className="space-y-4">
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
                  name="visibility.displayName"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">公開姓名</FormLabel>
                        <FormDescription>
                          允許其他使用者查看您的姓名
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* 生日 */}
              <div className="space-y-4">
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
                  name="visibility.birthDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">公開生日</FormLabel>
                        <FormDescription>
                          允許其他使用者查看您的生日
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* 性別 */}
              <div className="space-y-4">
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
                  name="visibility.gender"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">公開性別</FormLabel>
                        <FormDescription>
                          允許其他使用者查看您的性別
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* 職業 */}
              <div className="space-y-4">
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
                  name="visibility.occupation"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">公開職業</FormLabel>
                        <FormDescription>
                          允許其他使用者查看您的職業
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* 學歷 */}
              <div className="space-y-4">
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
                  name="visibility.education"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">公開學歷</FormLabel>
                        <FormDescription>
                          允許其他使用者查看您的學歷
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* 技能 */}
              <div className="space-y-4">
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
                  name="visibility.skills"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">公開技能</FormLabel>
                        <FormDescription>
                          允許其他使用者查看您的技能
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* 簡介 */}
              <div className="space-y-4">
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
                  name="visibility.bio"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">公開簡介</FormLabel>
                        <FormDescription>
                          允許其他使用者查看您的簡介
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

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
            {/* 顯示模式：根據 visibility 顯示字段和狀態 */}
            {initialProfile?.displayName && (
              <>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-muted-foreground">
                      姓名
                    </label>
                    {visibility?.displayName && (
                      <span className="text-xs text-muted-foreground">公開</span>
                    )}
                  </div>
                  <p className="mt-1 text-base">
                    {initialProfile.displayName}
                  </p>
                </div>
                <Separator />
              </>
            )}

            {initialProfile?.birthDate && (
              <>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-muted-foreground">
                      生日
                    </label>
                    {visibility?.birthDate && (
                      <span className="text-xs text-muted-foreground">公開</span>
                    )}
                  </div>
                  <p className="mt-1 text-base">
                    {new Date(initialProfile.birthDate).toLocaleDateString(
                      "zh-TW"
                    )}
                  </p>
                </div>
                <Separator />
              </>
            )}

            {initialProfile?.gender && (
              <>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-muted-foreground">
                      性別
                    </label>
                    {visibility?.gender && (
                      <span className="text-xs text-muted-foreground">公開</span>
                    )}
                  </div>
                  <p className="mt-1 text-base">
                    {initialProfile.gender === "male"
                      ? "男性"
                      : initialProfile.gender === "female"
                      ? "女性"
                      : initialProfile.gender === "other"
                      ? "其他"
                      : initialProfile.gender === "unspecified"
                      ? "不指定"
                      : "未設定"}
                  </p>
                </div>
                <Separator />
              </>
            )}

            {initialProfile?.occupation && (
              <>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-muted-foreground">
                      職業
                    </label>
                    {visibility?.occupation && (
                      <span className="text-xs text-muted-foreground">公開</span>
                    )}
                  </div>
                  <p className="mt-1 text-base">
                    {initialProfile.occupation}
                  </p>
                </div>
                <Separator />
              </>
            )}

            {initialProfile?.education && (
              <>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-muted-foreground">
                      學歷
                    </label>
                    {visibility?.education && (
                      <span className="text-xs text-muted-foreground">公開</span>
                    )}
                  </div>
                  <p className="mt-1 text-base">
                    {initialProfile.education}
                  </p>
                </div>
                <Separator />
              </>
            )}

            {initialProfile?.skills && (
              <>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-muted-foreground">
                      技能
                    </label>
                    {visibility?.skills && (
                      <span className="text-xs text-muted-foreground">公開</span>
                    )}
                  </div>
                  <p className="mt-1 text-base">
                    {Array.isArray(initialProfile.skills)
                      ? initialProfile.skills.join(", ")
                      : String(initialProfile.skills)}
                  </p>
                </div>
                <Separator />
              </>
            )}

            {initialProfile?.bio && (
              <>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-muted-foreground">
                      簡介
                    </label>
                    {visibility?.bio && (
                      <span className="text-xs text-muted-foreground">公開</span>
                    )}
                  </div>
                  <p className="mt-1 text-base whitespace-pre-wrap">
                    {initialProfile.bio}
                  </p>
                </div>
              </>
            )}

            {/* 如果沒有任何資料，顯示提示 */}
            {!initialProfile?.displayName &&
              !initialProfile?.birthDate &&
              !initialProfile?.gender &&
              !initialProfile?.occupation &&
              !initialProfile?.education &&
              !initialProfile?.skills &&
              !initialProfile?.bio && (
                <p className="text-sm text-muted-foreground">
                  尚未填寫個人資料，點擊「編輯」開始填寫
                </p>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
