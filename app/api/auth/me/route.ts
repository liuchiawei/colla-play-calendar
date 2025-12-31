// 獲取當前登入用戶信息 API Route
// 返回當前用戶的完整信息（包含 isAdmin）
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { ApiResponse, UserWithAdmin } from "@/lib/types";
import { z } from "zod";
import { revalidateTag } from "next/cache";

// 更新用戶頭像驗證規則
const updateAvatarSchema = z.object({
  image: z.string().url().nullable(),
});

// GET /api/auth/me - 獲取當前登入用戶的完整信息
export async function GET(request: NextRequest) {
  try {
    // 透過 Better Auth 取得登入狀態
    let session;
    try {
      // request.headers 已經是 Headers 對象，可以直接使用
      session = await auth.api.getSession({ 
        headers: request.headers 
      });
    } catch (sessionError) {
      console.error("[API /auth/me] Failed to get session:", sessionError);
      console.error("[API /auth/me] Session error details:", {
        message: sessionError instanceof Error ? sessionError.message : String(sessionError),
        stack: sessionError instanceof Error ? sessionError.stack : undefined,
        errorName: sessionError instanceof Error ? sessionError.name : typeof sessionError,
      });
      
      // 返回詳細錯誤信息（僅在開發環境）
      const errorMessage = process.env.NODE_ENV === "development" 
        ? (sessionError instanceof Error ? sessionError.message : "取得登入狀態失敗")
        : "取得登入狀態失敗";
        
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: errorMessage,
        },
        { status: 500 }
      );
    }

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

    if (!userId) {
      console.error("[API /auth/me] Session user ID is missing");
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "用戶 ID 無效",
        },
        { status: 400 }
      );
    }

    // 從資料庫獲取用戶完整信息（包含 isAdmin）
    // 使用 select 僅查詢需要的欄位，減少記憶體負擔
    let user;
    try {
      console.log("[API /auth/me] Querying user with ID:", userId, "Type:", typeof userId);
      
      // 先測試資料庫連接
      await prisma.$connect().catch((connectError) => {
        console.error("[API /auth/me] Database connection failed:", connectError);
      });
      
      user = await prisma.user.findUnique({
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
      
      console.log("[API /auth/me] User query result:", user ? `Found user: ${user.email}` : "Not found");
    } catch (dbError) {
      console.error("[API /auth/me] Database query failed:", dbError);
      console.error("[API /auth/me] Database error details:", {
        message: dbError instanceof Error ? dbError.message : String(dbError),
        stack: dbError instanceof Error ? dbError.stack : undefined,
        errorName: dbError instanceof Error ? dbError.name : typeof dbError,
        userId: userId,
        userIdType: typeof userId,
        code: (dbError as any)?.code,
        meta: (dbError as any)?.meta,
      });
      
      // 返回詳細錯誤信息（僅在開發環境）
      const errorMessage = process.env.NODE_ENV === "development"
        ? (dbError instanceof Error ? `${dbError.message} (${dbError.name})` : "資料庫查詢失敗")
        : "資料庫查詢失敗";
        
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: errorMessage,
        },
        { status: 500 }
      );
    } finally {
      // 不關閉連接，讓連接池管理
      // await prisma.$disconnect();
    }

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

    // 設置 cache headers（可選，用於客戶端快取）
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );

    return response;
  } catch (error) {
    // 捕獲所有未預期的錯誤
    console.error("[API /auth/me] Unexpected error:", error);
    console.error("[API /auth/me] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
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

