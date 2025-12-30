// Categories API Route - PUT（更新）、DELETE（削除）
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { ApiResponse, CategoryInput } from "@/lib/types";
import type { Category } from "@/lib/generated/prisma/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// PUT /api/categories/[id] - カテゴリを更新
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body: CategoryInput = await request.json();

    // 存在確認
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "カテゴリが見つかりません",
        },
        { status: 404 }
      );
    }

    // バリデーション
    if (!body.name || !body.color) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "名前と色は必須です",
        },
        { status: 400 }
      );
    }

    // 重複チェック（自分以外）
    const duplicate = await prisma.category.findFirst({
      where: {
        name: body.name,
        id: { not: id },
      },
    });

    if (duplicate) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "同じ名前のカテゴリが既に存在します",
        },
        { status: 400 }
      );
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: body.name,
        color: body.color,
      },
    });

    return NextResponse.json<ApiResponse<Category>>({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Failed to update category:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "カテゴリの更新に失敗しました",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - カテゴリを削除
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // 存在確認
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "カテゴリが見つかりません",
        },
        { status: 404 }
      );
    }

    // 関連するイベントのカテゴリをnullに設定してから削除
    await prisma.event.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json<ApiResponse<{ id: string }>>({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "カテゴリの削除に失敗しました",
      },
      { status: 500 }
    );
  }
}
