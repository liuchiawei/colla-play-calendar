// CollaPlay 後台管理頁面（Server Component）
// SSG 対応のため、Client Component をラップ

import DashboardClient from "./components/dashboard.client";

export default function DashboardPage() {
  return <DashboardClient />;
}
