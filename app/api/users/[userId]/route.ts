// 用戶管理 API Route - PATCH（更新用戶信息）
// 僅管理員可訪問，防止管理員移除自己的管理員權限
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { ApiResponse, UpdateUserInput, UserWithAdmin } from "@/lib/types";
import { z } from "zod";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

// 更新用戶輸入驗證規則
const updateUserSchema = z.object({
  isAdmin: z.boolean().optional(),
  name: z.string().nullable().optional(),
});

// 檢查是否為管理員的輔助函數
async function checkAdmin(request: NextRequest): Promise<{ isAdmin: boolean; userId: string | null }> {
  const session = await auth.api.getSession({ headers: request.headers });
  
  if (!session || !session.user) {
    return { isAdmin: false, userId: null };
  }

  const userId = session.user.id;
  
  // 從資料庫獲取用戶的 isAdmin 狀態
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  return {
    isAdmin: user?.isAdmin ?? false,
    userId,
  };
}

// PATCH /api/users/[userId] - 更新用戶信息（僅管理員可訪問）
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // 檢查管理員權限
    const { isAdmin, userId: currentUserId } = await checkAdmin(request);
    
    if (!isAdmin) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "需要管理員權限",
        },
        { status: 403 }
      );
    }

    const { userId } = await context.params;

    // 解析請求體
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // 防止管理員移除自己的管理員權限
    if (validatedData.isAdmin === false && currentUserId === userId) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "無法移除自己的管理員權限",
        },
        { status: 400 }
      );
    }

    // 檢查目標用戶是否存在
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "用戶不存在",
        },
        { status: 404 }
      );
    }

    // 更新用戶信息
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(validatedData.isAdmin !== undefined && { isAdmin: validatedData.isAdmin }),
        ...(validatedData.name !== undefined && { name: validatedData.name }),
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

    return NextResponse.json<ApiResponse<UserWithAdmin>>({
      success: true,
      data: updatedUser as UserWithAdmin,
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

    console.error("Failed to update user:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "更新用戶信息失敗",
      },
      { status: 500 }
    );
  }
}

