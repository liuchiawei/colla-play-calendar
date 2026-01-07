// 留言管理 API Route
// PUT: 更新留言, DELETE: 刪除留言

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAnonymousSessionId } from "@/lib/utils/registration";
import {
  updateComment,
  deleteComment,
} from "@/lib/services/comments/comment.service";
import type { ApiResponse, CommentUpdateInput } from "@/lib/types";
import { z } from "zod";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// 留言更新輸入驗證規則
const commentUpdateSchema = z.object({
  content: z
    .string()
    .min(1, "留言內容不能為空")
    .max(5000, "留言內容不能超過 5000 字"),
});

// PUT /api/comments/[id] - 更新留言
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id: commentId } = await context.params;

    // 取得登入狀態
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id || null;

    // 取得匿名 session ID（如果未登入）
    let anonymousSessionId: string | undefined;
    if (!userId) {
      anonymousSessionId = await getAnonymousSessionId();
    }

    if (!userId && !anonymousSessionId) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "未登入",
        },
        { status: 401 }
      );
    }

    // 解析請求體
    const body = await request.json();
    const validatedData = commentUpdateSchema.parse(body) as CommentUpdateInput;

    // 更新留言
    const comment = await updateComment(
      commentId,
      validatedData,
      userId,
      anonymousSessionId
    );

    return NextResponse.json<ApiResponse<typeof comment>>({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error("[API /comments/[id]] Failed to update comment:", error);

    // 處理驗證錯誤
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: error.issues[0]?.message || "輸入資料驗證失敗",
        },
        { status: 400 }
      );
    }

    // 處理業務邏輯錯誤
    if (error instanceof Error) {
      const statusCode = error.message.includes("無權限") ? 403 : 404;
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: error.message,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "更新留言失敗",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[id] - 刪除留言
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: commentId } = await context.params;

    // 取得登入狀態
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id || null;

    // 取得匿名 session ID（如果未登入）
    let anonymousSessionId: string | undefined;
    if (!userId) {
      anonymousSessionId = await getAnonymousSessionId();
    }

    if (!userId && !anonymousSessionId) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "未登入",
        },
        { status: 401 }
      );
    }

    // 刪除留言
    await deleteComment(commentId, userId, anonymousSessionId);

    return NextResponse.json<ApiResponse<{ deleted: true }>>({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error("[API /comments/[id]] Failed to delete comment:", error);

    // 處理業務邏輯錯誤
    if (error instanceof Error) {
      const statusCode = error.message.includes("無權限") ? 403 : 404;
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: error.message,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "刪除留言失敗",
      },
      { status: 500 }
    );
  }
}
