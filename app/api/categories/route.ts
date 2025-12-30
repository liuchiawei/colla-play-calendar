// Categories API Route - GET（一覧取得）、POST（新規作成）
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { ApiResponse, CategoryInput } from "@/lib/types";
import type { Category } from "@/lib/generated/prisma/client";

// GET /api/categories - カテゴリ一覧を取得
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json<ApiResponse<Category[]>>({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "カテゴリの取得に失敗しました",
      },
      { status: 500 }
    );
  }
}

// POST /api/categories - 新しいカテゴリを作成
export async function POST(request: NextRequest) {
  try {
    const body: CategoryInput = await request.json();

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

    // 重複チェック
    const existing = await prisma.category.findFirst({
      where: { name: body.name },
    });

    if (existing) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "同じ名前のカテゴリが既に存在します",
        },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: body.name,
        color: body.color,
      },
    });

    return NextResponse.json<ApiResponse<Category>>(
      {
        success: true,
        data: category,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "カテゴリの作成に失敗しました",
      },
      { status: 500 }
    );
  }
}

