"use client";

// 註冊表單（Client Component）
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signUp } from "@/lib/services/auth/auth.service";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { AuthFormLayout } from "@/components/features/user/auth-form-layout";
import {
  EmailField,
  PasswordField,
  ConfirmPasswordField,
} from "@/components/features/user/auth-form-fields";

// 註冊表單驗證規則
const registerSchema = z
  .object({
    email: z.string().email("請輸入有效的電子郵件地址"),
    password: z.string().min(8, "密碼至少需要 8 個字元"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "密碼不一致",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const { fetchUser } = useAuthStore();
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
      // 使用統一的認證服務進行註冊
      // Better Auth 需要 name 參數，使用 email 的本地部分作為預設名稱
      const name = data.email.split("@")[0] || "";

      const result = await signUp(data.email, data.password, name, {
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
        setError(result.error || "註冊失敗");
        return;
      }
    } catch (err) {
      // 處理未預期的錯誤
      const errorMessage = "註冊失敗，請再試一次";
      setError(errorMessage);
      console.error("Register error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFormLayout
      title="註冊"
      description="建立新帳號開始使用"
      error={error}
      footerText="已有帳號？"
      footerLinkText="登入"
      footerLinkHref="/login"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <EmailField control={form.control} />
          <PasswordField control={form.control} />
          <ConfirmPasswordField control={form.control} />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "註冊中..." : "註冊"}
          </Button>
        </form>
      </Form>
    </AuthFormLayout>
  );
}
