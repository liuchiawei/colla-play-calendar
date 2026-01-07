// 留言回覆 API Route
// GET: 獲取回覆列表, POST: 建立回覆

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getOrCreateAnonymousSessionId,
  getAnonymousSessionId,
} from "@/lib/utils/registration";
import {
  getCommentReplies,
  createComment,
} from "@/lib/services/comments/comment.service";
import prisma from "@/lib/prisma";
import type {
  ApiResponse,
  CommentListResponse,
  CommentInput,
} from "@/lib/types";
import { z } from "zod";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// 回覆輸入驗證規則
const replyInputSchema = z.object({
  content: z
    .string()
    .min(1, "留言內容不能為空")
    .max(5000, "留言內容不能超過 5000 字"),
});

// GET /api/comments/[id]/replies - 獲取回覆列表
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: commentId } = await context.params;

    // 獲取查詢參數
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    // 取得登入狀態
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id || null;

    // 取得匿名 session ID（如果未登入）
    let anonymousSessionId: string | undefined;
    if (!userId) {
      anonymousSessionId = await getAnonymousSessionId();
    }

    // 獲取回覆列表
    const replies = await getCommentReplies(
      commentId,
      page,
      pageSize,
      userId,
      anonymousSessionId
    );

    return NextResponse.json<ApiResponse<CommentListResponse>>({
      success: true,
      data: replies,
    });
  } catch (error) {
    console.error("[API /comments/[id]/replies] Failed to get replies:", error);

    // 處理業務邏輯錯誤
    if (error instanceof Error) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: error.message,
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "獲取回覆列表失敗",
      },
      { status: 500 }
    );
  }
}

// POST /api/comments/[id]/replies - 建立回覆
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

    // 獲取父留言以取得 eventId
    const parentComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { eventId: true },
    });

    if (!parentComment) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "父留言不存在",
        },
        { status: 404 }
      );
    }

    // 解析請求體
    const body = await request.json();
    const validatedData = replyInputSchema.parse(body);

    // 建立回覆
    const reply = await createComment(
      parentComment.eventId,
      {
        content: validatedData.content,
        parentId: commentId,
      },
      userId,
      anonymousSessionId
    );

    return NextResponse.json<ApiResponse<typeof reply>>({
      success: true,
      data: reply,
    });
  } catch (error) {
    console.error(
      "[API /comments/[id]/replies] Failed to create reply:",
      error
    );

    // 處理驗證錯誤
    if (error instanceof z.ZodError) {
      const contentError = error.issues.find(
        (issue) => issue.path[0] === "content"
      );
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error:
            contentError?.message ||
            error.issues[0]?.message ||
            "輸入資料驗證失敗",
        },
        { status: 400 }
      );
    }

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
        error: "建立回覆失敗",
      },
      { status: 500 }
    );
  }
}
