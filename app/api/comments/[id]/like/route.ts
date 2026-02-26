// 留言按讚 API Route
// POST: 切換按讚狀態（按讚/取消按讚）

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrCreateAnonymousSessionId } from "@/lib/utils/registration";
import { toggleCommentLike } from "@/lib/services/comments/comment.service";
import type { ApiResponse, CommentLikeResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/comments/[id]/like - 切換按讚狀態
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: commentId } = await context.params;

    // 取得登入狀態
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id || null;

    // 取得匿名 session ID（如果未登入）
    let anonymousSessionId: string | undefined;
    if (!userId) {
      anonymousSessionId = await getOrCreateAnonymousSessionId();
    }

    // 切換按讚狀態
    const result = await toggleCommentLike(
      commentId,
      userId,
      anonymousSessionId
    );

    return NextResponse.json<ApiResponse<CommentLikeResponse>>({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[API /comments/[id]/like] Failed to toggle like:", error);

    // 處理業務邏輯錯誤
    if (error instanceof Error) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "按讚操作失敗",
      },
      { status: 500 }
    );
  }
}
