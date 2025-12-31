// 登入頁面
// 使用 Better Auth 的登入功能
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import LoginForm from "./component/login-form";

// 強制動態渲染，確保不會快取
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // 若已登入，則導向個人資料頁面
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    redirect("/profile");
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <LoginForm />
    </div>
  );
}

