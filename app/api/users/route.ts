// 用戶管理 API Route - GET（獲取用戶列表）
// 僅管理員可訪問
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { ApiResponse, UserListResponse, UserWithAdmin } from "@/lib/types";

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

// GET /api/users - 獲取用戶列表（僅管理員可訪問）
export async function GET(request: NextRequest) {
  try {
    // 檢查管理員權限
    const { isAdmin } = await checkAdmin(request);
    
    if (!isAdmin) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "需要管理員權限",
        },
        { status: 403 }
      );
    }

    // 獲取查詢參數
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all"; // all, admin, user
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

    // 構建查詢條件
    const where: any = {};

    // 搜尋條件（姓名或 Email）
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // 篩選條件（管理員/一般用戶）
    if (filter === "admin") {
      where.isAdmin = true;
    } else if (filter === "user") {
      where.isAdmin = false;
    }

    // 獲取總數
    const total = await prisma.user.count({ where });

    // 獲取用戶列表
    const users = await prisma.user.findMany({
      where,
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
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const response: UserListResponse = {
      users: users as UserWithAdmin[],
      total,
      page,
      pageSize,
    };

    return NextResponse.json<ApiResponse<UserListResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "取得用戶列表失敗",
      },
      { status: 500 }
    );
  }
}

