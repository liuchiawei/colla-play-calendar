// 用戶管理 API Route - PATCH（更新用戶信息）
// 僅管理員可訪問，防止管理員移除自己的管理員權限
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/services/auth/auth-server.service";
import prisma from "@/lib/prisma";
import type { ApiResponse, UserWithAdmin } from "@/lib/types";
import { z } from "zod";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

// 更新用戶輸入驗證規則
const updateUserSchema = z.object({
  isAdmin: z.boolean().optional(),
  name: z.string().nullable().optional(),
});

// PATCH /api/users/[userId] - 更新用戶信息（僅管理員可訪問）
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // 使用統一的認證服務檢查管理員權限（帶快取）
    const adminResult = await requireAdmin(request);

    // 如果未登入或不是管理員，requireAdmin 會返回 NextResponse
    if (adminResult instanceof NextResponse) {
      return adminResult;
    }

    const { userId: currentUserId } = adminResult;

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

// DELETE /api/users/[userId] - 刪除用戶（僅管理員可訪問，不可刪除自己）
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const adminResult = await requireAdmin(_request);

    if (adminResult instanceof NextResponse) {
      return adminResult;
    }

    const { userId: currentUserId } = adminResult;
    const { userId } = await context.params;

    if (currentUserId === userId) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "無法刪除自己的帳號",
        },
        { status: 400 }
      );
    }

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

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "刪除用戶失敗",
      },
      { status: 500 }
    );
  }
}

