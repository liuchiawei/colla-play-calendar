"use client";

// 登入表單（Client Component）
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { AuthFormLayout } from "@/components/features/user/auth-form-layout";
import {
  EmailField,
  PasswordField,
} from "@/components/features/user/auth-form-fields";

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
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        setError(result.error.message || "登入失敗");
        return;
      }

      // 登入成功後，清除快取並更新狀態
      try {
        // 清除用戶認證快取
        await fetch("/api/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tags: ["user-auth"] }),
          credentials: "include", // 確保包含 cookies
        });

        // 更新客戶端 auth store
        await fetchUser();
      } catch (revalidateError) {
        console.error("[Login] Failed to revalidate cache:", revalidateError);
        // 即使 revalidate 失敗，仍然繼續登入流程
      }

      // 導向個人資料頁面
      router.push("/profile");
      router.refresh();
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
        </form>
      </Form>
    </AuthFormLayout>
  );
}
