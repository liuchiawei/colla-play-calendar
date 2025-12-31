// Events API Route - GET（一覧取得）、POST（新規作成）
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getAnonymousSessionId } from "@/lib/utils/registration";
import type { ApiResponse, EventWithCategory, EventInput } from "@/lib/types";

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
export async function POST(request: NextRequest) {
  try {
    const body: EventInput = await request.json();

    // バリデーション
    if (!body.title || !body.startTime || !body.endTime) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "タイトル、開始日時、終了日時は必須です",
        },
        { status: 400 }
      );
    }

    // 日時の検証
    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);

    if (endTime <= startTime) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "終了日時は開始日時より後である必要があります",
        },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title: body.title,
        description: body.description || null,
        startTime,
        endTime,
        location: body.location || null,
        organizer: body.organizer || null,
        imageUrl: body.imageUrl || null,
        imageBlobUrl: body.imageBlobUrl || null,
        imageBlobPathname: body.imageBlobPathname || null,
        registrationUrl: body.registrationUrl || null,
        price: body.price || null,
        categoryId: body.categoryId || null,
      } as any,
      include: {
        category: true,
      },
    });

    return NextResponse.json<ApiResponse<EventWithCategory>>(
      {
        success: true,
        data: event,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "イベントの作成に失敗しました",
      },
      { status: 500 }
    );
  }
}
