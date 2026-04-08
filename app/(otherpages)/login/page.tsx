// 登入頁面
// 使用 Better Auth 的登入功能
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  getRequestOriginFromHeaders,
  getReturnToFromReferer,
} from "@/lib/utils/auth-return-to";
import {
  getNextFromSearchParams,
  type NextSearchParams,
} from "@/lib/utils/login-next";
import LoginForm from "./component/login-form";
import SectionContainer from "@/components/layout/section-container";

// 強制動態渲染，確保不會快取
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<NextSearchParams>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const h = await headers();
  // 若已登入，則導向個人資料頁面
  const session = await auth.api.getSession({ headers: h });
  if (session?.user) {
    redirect("/profile");
  }

  const sp = searchParams ? await searchParams : undefined;
  const next = sp ? getNextFromSearchParams(sp) : null;

  const referer = h.get("referer");
  const allowedOrigin = getRequestOriginFromHeaders(h);
  const returnTo = getReturnToFromReferer(referer, allowedOrigin);

  return (
    <SectionContainer>
      <LoginForm redirectTo={next ?? returnTo ?? "/profile"} />
    </SectionContainer>
  );
}

