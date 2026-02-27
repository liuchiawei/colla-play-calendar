// 成員管理頁 (dashboard-new/users)
// RSC：僅渲染 client 內容，資料由 SWR 在 client 取得

import { UsersContent } from "./users-content.client";

export default function UsersPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <UsersContent />
    </div>
  );
}
