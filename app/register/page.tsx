// 註冊頁面
// 使用 Better Auth 的使用者註冊功能
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import RegisterForm from "./register-form";

export default async function RegisterPage() {
  // 若已登入，則導向個人資料頁面
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    redirect("/profile");
  }

  return (
    <div className="container flex min-h-screen items-center justify-center py-12">
      <RegisterForm />
    </div>
  );
}
