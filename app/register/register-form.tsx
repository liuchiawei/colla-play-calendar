"use client";

// 註冊表單（Client Component）
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Link from "next/link";

// 註冊表單驗證規則
const registerSchema = z
  .object({
    email: z.string().email("請輸入有效的電子郵件地址"),
    password: z.string().min(6, "密碼至少需要 6 個字元"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "密碼不一致",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      // Better Auth 需要 name 參數，使用 email 的本地部分作為預設名稱
      const name = data.email.split("@")[0] || "";
      
      // デバッグ用：リクエスト前の状態を確認
      if (process.env.NODE_ENV === "development") {
        console.log("[Debug] 準備發送註冊請求");
        console.log("[Debug] NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL || "未設定");
        console.log("[Debug] 當前頁面 URL:", typeof window !== "undefined" ? window.location.href : "N/A");
      }
      
      const result = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: name,
      });

      if (result.error) {
        setError(result.error.message || "註冊失敗");
        return;
      }

      // 註冊成功後，自動登入並導向個人資料頁面
      router.push("/profile");
      router.refresh();
    } catch (err) {
      // エラーメッセージを詳細化（SSL/Mixed Content/Invalid URL などの問題を特定）
      let errorMessage = "註冊失敗，請再試一次";
      
      if (err instanceof Error) {
        const errorMsg = err.message.toLowerCase();
        
        // SSL/Mixed Content エラーの検出
        if (
          errorMsg.includes("ssl") ||
          errorMsg.includes("mixed content") ||
          errorMsg.includes("https://localhost") ||
          errorMsg.includes("protocol")
        ) {
          errorMessage =
            "連線錯誤：請檢查 baseURL 設定。若在開發環境，請確認使用 http://localhost:3000 而非 https://localhost:3000";
        }
        // Invalid URL エラーの検出
        else if (
          errorMsg.includes("invalid url") ||
          errorMsg.includes("failed to parse") ||
          errorMsg.includes("malformed")
        ) {
          errorMessage =
            "URL 格式錯誤：請檢查環境變數 NEXT_PUBLIC_APP_URL 是否為合法格式（不可包含雙協定，例如 http://https://...）";
        }
        // ネットワークエラー
        else if (
          errorMsg.includes("network") ||
          errorMsg.includes("fetch") ||
          errorMsg.includes("cors")
        ) {
          // より詳細なデバッグ情報を提供
          const baseURL = process.env.NEXT_PUBLIC_APP_URL || "未設定";
          errorMessage =
            `網路連線失敗：請檢查瀏覽器 DevTools Network 標籤。\n` +
            `預期端點：/api/auth/sign-up/email\n` +
            `NEXT_PUBLIC_APP_URL: ${baseURL}\n` +
            `若環境變數包含雙協定（如 http://https://...），請修正或移除該變數以使用同網域模式`;
        }
        // その他のエラーは元のメッセージを使用
        else {
          errorMessage = err.message || errorMessage;
        }
      }
      
      setError(errorMessage);
      console.error("Register error:", err);
      // デバッグ用：実際のリクエスト URL を確認
      if (typeof window !== "undefined") {
        console.log("[Debug] Current window.location:", window.location.href);
        console.log("[Debug] NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL || "未設定");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>註冊</CardTitle>
        <CardDescription>建立新帳號開始使用</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>電子郵件</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>密碼</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>確認密碼</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "註冊中..." : "註冊"}
            </Button>
          </form>
        </Form>

        <div className="mt-4 text-center text-sm">
          <span className="text-muted-foreground">已有帳號？</span>{" "}
          <Link href="/login" className="text-primary hover:underline">
            登入
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
