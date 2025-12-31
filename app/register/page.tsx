// 註冊頁面
// 使用 Better Auth 的使用者註冊功能
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import RegisterForm from "./component/register-form";

// 強制動態渲染，確保不會快取
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  // 若已登入，則導向個人資料頁面
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    redirect("/profile");
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <RegisterForm />
    </div>
  );
}
