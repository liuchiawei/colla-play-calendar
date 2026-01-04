// 獲取當前登入用戶信息 API Route
// 返回當前用戶的完整信息（包含 isAdmin）
// 使用快取策略優化性能，減少資料庫查詢
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import {
  requireAuth,
  getCurrentUser,
} from "@/lib/services/auth/auth-server.service";
import prisma from "@/lib/prisma";
import type { ApiResponse, UserWithAdmin } from "@/lib/types";

// 更新用戶頭像驗證規則
const updateAvatarSchema = z.object({
  image: z.string().url().nullable(),
});

// GET /api/auth/me - 獲取當前登入用戶的完整信息（使用快取優化）
export async function GET(request: NextRequest) {
  try {
    // 使用統一的認證服務檢查登入狀態
    const authResult = await requireAuth(request);

    // 如果未登入，requireAuth 會返回 NextResponse
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId } = authResult;

    // 使用快取的 getCurrentUser 獲取用戶信息（已包含快取邏輯）
    const user = await getCurrentUser(userId);

    if (!user) {
      console.warn(`[API /auth/me] User not found for ID: ${userId}`);
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "用戶不存在",
        },
        { status: 404 }
      );
    }

    // 設置快取標籤，用於後續 revalidate
    const response = NextResponse.json<ApiResponse<UserWithAdmin>>({
      success: true,
      data: user,
    });

    // 設置 cache headers（用於客戶端快取，配合服務端快取）
    response.headers.set(
      "Cache-Control",
      "private, s-maxage=300, stale-while-revalidate=60"
    );

    return response;
  } catch (error) {
    // 捕獲所有未預期的錯誤
    console.error("[API /auth/me] Unexpected error:", error);
    console.error(
      "[API /auth/me] Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: error instanceof Error ? error.message : "取得用戶信息失敗",
      },
      { status: 500 }
    );
  }
}

// PATCH /api/auth/me - 更新當前登入用戶的頭像
export async function PATCH(request: NextRequest) {
  try {
    // 使用統一的認證服務檢查登入狀態
    const authResult = await requireAuth(request);

    // 如果未登入，requireAuth 會返回 NextResponse
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId } = authResult;

    // 解析請求體
    const body = await request.json();
    const validatedData = updateAvatarSchema.parse(body);

    // 更新用戶頭像
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        image: validatedData.image,
      },
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

    // 清除相關快取（Next.js 16 語法：第二個參數為必須）
    revalidateTag(`user-${userId}`, "max");
    revalidateTag("user-auth", "max");

    return NextResponse.json<ApiResponse<UserWithAdmin>>({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "輸入資料格式錯誤",
        },
        { status: 400 }
      );
    }

    console.error("Failed to update avatar:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "更新頭像失敗",
      },
      { status: 500 }
    );
  }
}
