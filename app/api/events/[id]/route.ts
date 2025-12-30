// Events API Route - GET（単一取得）、PUT（更新）、DELETE（削除）
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { ApiResponse, EventWithCategory, EventInput } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/events/[id] - 単一のイベントを取得
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!event) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "イベントが見つかりません",
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<EventWithCategory>>({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Failed to fetch event:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "イベントの取得に失敗しました",
      },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] - イベントを更新
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body: EventInput = await request.json();

    // 存在確認
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "イベントが見つかりません",
        },
        { status: 404 }
      );
    }

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

    const event = await prisma.event.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description || null,
        startTime,
        endTime,
        location: body.location || null,
        organizer: body.organizer || null,
        imageUrl: body.imageUrl || null,
        registrationUrl: body.registrationUrl || null,
        price: body.price || null,
        categoryId: body.categoryId || null,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json<ApiResponse<EventWithCategory>>({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Failed to update event:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "イベントの更新に失敗しました",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - イベントを削除
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // 存在確認
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "イベントが見つかりません",
        },
        { status: 404 }
      );
    }

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json<ApiResponse<{ id: string }>>({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error("Failed to delete event:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "イベントの削除に失敗しました",
      },
      { status: 500 }
    );
  }
}

