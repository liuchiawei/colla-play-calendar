// Revalidate API Route
// 用於清除快取標籤，優化登入/註冊後的狀態更新
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import type { ApiResponse } from "@/lib/types";

// POST /api/revalidate - 清除指定快取標籤
export async function POST(request: NextRequest) {
  try {
    // 驗證用戶已登入（可選，根據需求調整）
    const session = await auth.api.getSession({ headers: request.headers });

    const body = await request.json();
    const { tags, userId } = body as { tags?: string[]; userId?: string };

    // 如果提供了 userId，清除該用戶的快取
    if (userId) {
      revalidateTag(`user-${userId}`, "max");
    }

    // 清除用戶認證相關快取
    revalidateTag("user-auth", "max");

    // 如果提供了額外的 tags，也一併清除
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        revalidateTag(tag, "max");
      }
    }

    return NextResponse.json<ApiResponse<{ revalidated: true }>>({
      success: true,
      data: { revalidated: true },
    });
  } catch (error) {
    console.error("Failed to revalidate:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "清除快取失敗",
      },
      { status: 500 }
    );
  }
}

