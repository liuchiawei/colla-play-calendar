// 活動留言 API Route
// GET: 獲取活動留言列表, POST: 建立新留言

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getOrCreateAnonymousSessionId,
  getAnonymousSessionId,
} from "@/lib/utils/registration";
import {
  getCommentsByEventId,
  createComment,
} from "@/lib/services/comments/comment.service";
import type {
  ApiResponse,
  CommentListResponse,
  CommentInput,
} from "@/lib/types";
import { z } from "zod";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// 留言輸入驗證規則
const commentInputSchema = z.object({
  content: z
    .string()
    .min(1, "留言內容不能為空")
    .max(5000, "留言內容不能超過 5000 字"),
  parentId: z.string().optional().nullable(),
});

// GET /api/events/[id]/comments - 獲取活動留言列表
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: eventId } = await context.params;

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

    // 獲取留言列表
    const comments = await getCommentsByEventId(
      eventId,
      page,
      pageSize,
      userId,
      anonymousSessionId
    );

    return NextResponse.json<ApiResponse<CommentListResponse>>({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error("[API /events/[id]/comments] Failed to get comments:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "獲取留言列表失敗",
      },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/comments - 建立新留言
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: eventId } = await context.params;

    // 取得登入狀態
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id || null;

    // 取得匿名 session ID（如果未登入）
    let anonymousSessionId: string | undefined;
    if (!userId) {
      anonymousSessionId = await getOrCreateAnonymousSessionId();
    }

    // 解析請求體
    const body = await request.json();
    const validatedData = commentInputSchema.parse(body) as CommentInput;

    // 建立留言
    const comment = await createComment(
      eventId,
      validatedData,
      userId,
      anonymousSessionId
    );

    return NextResponse.json<ApiResponse<typeof comment>>({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error(
      "[API /events/[id]/comments] Failed to create comment:",
      error
    );

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
        error: "建立留言失敗",
      },
      { status: 500 }
    );
  }
}
