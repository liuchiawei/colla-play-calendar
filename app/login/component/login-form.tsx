"use client";

// 登入表單（Client Component）
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "@/lib/services/auth/auth.service";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { AuthFormLayout } from "@/components/features/user/auth-form-layout";
import {
  EmailField,
  PasswordField,
} from "@/components/features/user/auth-form-fields";
import { GoogleAuthButton } from "@/components/features/user/google-auth-button";

// 登入表單驗證規則
const loginSchema = z.object({
  email: z.string().email("請輸入有效的電子郵件地址"),
  password: z.string().min(6, "密碼至少需要 6 個字元"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const { fetchUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      // 使用統一的認證服務進行登入
      const result = await signIn(data.email, data.password, {
        onSuccess: (user) => {
          // 更新客戶端 auth store
          if (user) {
            fetchUser();
          }
        },
        onNavigate: (path) => router.push(path),
        onRefresh: () => router.refresh(),
        redirectTo: "/profile",
      });

      if (!result.success) {
        setError(result.error || "登入失敗");
        return;
      }
    } catch (err) {
      setError("登入失敗，請再試一次");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFormLayout
      title="登入"
      description="請登入您的帳號以繼續"
      error={error}
      footerText="還沒有帳號？"
      footerLinkText="註冊"
      footerLinkHref="/register"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <EmailField control={form.control} />
          <PasswordField control={form.control} />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "登入中..." : "登入"}
          </Button>

          {/* 分隔線 */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                或
              </span>
            </div>
          </div>

          {/* Google 登入按鈕 */}
          <GoogleAuthButton
            label="使用 Google 登入"
            redirectTo="/profile"
          />
        </form>
      </Form>
    </AuthFormLayout>
  );
}
