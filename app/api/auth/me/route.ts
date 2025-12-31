// 獲取當前登入用戶信息 API Route
// 返回當前用戶的完整信息（包含 isAdmin）
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { ApiResponse, UserWithAdmin } from "@/lib/types";

// GET /api/auth/me - 獲取當前登入用戶的完整信息
export async function GET(request: NextRequest) {
  try {
    // 透過 Better Auth 取得登入狀態
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session || !session.user) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "需要登入",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 從資料庫獲取用戶完整信息（包含 isAdmin）
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "用戶不存在",
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<UserWithAdmin>>({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "取得用戶信息失敗",
      },
      { status: 500 }
    );
  }
}

