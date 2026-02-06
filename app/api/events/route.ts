// Events API Route - GET（一覧取得）、POST（新規作成）
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getAnonymousSessionId } from "@/lib/utils/registration";
import { requireAuth } from "@/lib/services/auth/auth-server.service";
import { createEvent } from "@/lib/services/events/event.service";
import type { ApiResponse, EventWithCategory, EventInput, EventStatus } from "@/lib/types";

// GET /api/events - イベント一覧を取得
// クエリパラメータ: start（開始日）、end（終了日）でフィルタリング可能
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    // 日付範囲でフィルタリング（重複イベントを含む）
    // イベントが範囲と重複する条件: startTime <= end AND endTime >= start
    const where: {
      AND?: Array<{
        startTime?: { lte?: Date };
        endTime?: { gte?: Date };
      }>;
      status?: EventStatus;
    } = {};

    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      where.AND = [
        { startTime: { lte: endDate } }, // イベント開始 <= 範囲終了
        { endTime: { gte: startDate } }, // イベント終了 >= 範囲開始
      ];
    } else if (start) {
      // start のみ: イベント終了 >= 範囲開始
      where.AND = [{ endTime: { gte: new Date(start) } }];
    } else if (end) {
      // end のみ: イベント開始 <= 範囲終了
      where.AND = [{ startTime: { lte: new Date(end) } }];
    }

    // 取得當前用戶 ID（如果已登入）
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id || null;

    // 取得匿名 session ID（如果未登入）
    let anonymousSessionId: string | undefined;
    if (!userId) {
      anonymousSessionId = await getAnonymousSessionId();
    }

    // 狀態過濾（如果提供）
    const status = searchParams.get("status") as EventStatus | null;
    if (status && status !== "all") {
      where.status = status;
    } else if (!status) {
      // 預設只顯示已發布的活動（如果沒有指定狀態）
      where.status = "published";
    }
    // 如果 status === "all"，不添加狀態過濾，顯示所有狀態的活動

    const events = await prisma.event.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: { registrations: true },
        },
        registrations: {
          where: {
            OR: [
              userId ? { userId } : { id: "" },
              anonymousSessionId ? { anonymousSessionId } : { id: "" },
            ],
          },
          select: { id: true },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // 轉換為前端格式
    const eventsWithCount: EventWithCategory[] = events.map((event) => {
      const { registrations, _count, ...eventData } = event;
      return {
        ...eventData,
        registrationCount: _count.registrations,
        isRegistered: registrations.length > 0,
      };
    });

    return NextResponse.json<ApiResponse<EventWithCategory[]>>({
      success: true,
      data: eventsWithCount,
    });
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "イベントの取得に失敗しました",
      },
      { status: 500 }
    );
  }
}

// POST /api/events - 新しいイベントを作成
// 要求登入驗證，設置 status: "pending"，記錄 createdBy
export async function POST(request: NextRequest) {
  try {
    // 檢查登入狀態
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId } = authResult;

    const body: EventInput = await request.json();

    // バリデーション
    if (!body.title || !body.startTime || !body.endTime) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "標題、開始時間、結束時間為必填",
        },
        { status: 400 }
      );
    }

    // 使用 event service 創建活動
    // 如果用戶指定了 status（例如 draft），使用該狀態；否則設為 pending
    const event = await createEvent(userId, body);

    return NextResponse.json<ApiResponse<EventWithCategory>>(
      {
        success: true,
        data: event,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create event:", error);
    const errorMessage =
      error instanceof Error ? error.message : "活動創建失敗";
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
