// Google Avatar 同步 API Route
// 在 OAuth 回調後同步 Google profile picture 到用戶的 image 欄位
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/services/auth/auth-server.service";
import prisma from "@/lib/prisma";
import type { ApiResponse } from "@/lib/types";

// POST /api/auth/sync-google-avatar - 同步 Google profile picture
export async function POST(request: NextRequest) {
  try {
    // 驗證用戶已登入
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId } = authResult;

    // 查詢用戶的 Google Account
    const googleAccount = await prisma.account.findFirst({
      where: {
        userId,
        providerId: "google",
      },
      select: {
        id: true,
        accessToken: true,
        idToken: true,
        accountId: true,
      },
    });

    if (!googleAccount) {
      // 用戶沒有 Google Account，不需要同步
      return NextResponse.json<ApiResponse<{ synced: false; reason: "no_google_account" }>>({
        success: true,
        data: { synced: false, reason: "no_google_account" },
      });
    }

    // 獲取當前用戶信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        image: true,
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

    // 如果用戶已有頭像，不覆蓋（僅在 image 為空時設置）
    if (user.image) {
      return NextResponse.json<ApiResponse<{ synced: false; reason: "avatar_exists" }>>({
        success: true,
        data: { synced: false, reason: "avatar_exists" },
      });
    }

    let googlePictureUrl: string | null = null;

    // 方法 1: 嘗試從 idToken 中提取 picture（如果可用）
    if (googleAccount.idToken) {
      try {
        // idToken 是 JWT，解碼 payload 部分
        const payload = JSON.parse(
          Buffer.from(googleAccount.idToken.split(".")[1], "base64").toString()
        );
        if (payload.picture) {
          googlePictureUrl = payload.picture;
        }
      } catch (error) {
        // idToken 解析失敗，繼續嘗試其他方法
        console.warn("[Sync Google Avatar] Failed to parse idToken:", error);
      }
    }

    // 方法 2: 如果 idToken 中沒有 picture，使用 Google People API
    if (!googlePictureUrl && googleAccount.accessToken) {
      try {
        const response = await fetch(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          {
            headers: {
              Authorization: `Bearer ${googleAccount.accessToken}`,
            },
          }
        );

        if (response.ok) {
          const userInfo = await response.json();
          if (userInfo.picture) {
            googlePictureUrl = userInfo.picture;
          }
        } else {
          console.warn(
            "[Sync Google Avatar] Failed to fetch user info:",
            response.status,
            response.statusText
          );
        }
      } catch (error) {
        console.error("[Sync Google Avatar] Error fetching Google user info:", error);
      }
    }

    // 如果成功獲取到 Google picture，更新用戶的 image
    if (googlePictureUrl) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          image: googlePictureUrl,
        },
      });

      // 清除相關快取（Next.js 16 語法：第二個參數為必須）
      revalidateTag(`user-${userId}`, "max");
      revalidateTag("user-auth", "max");

      return NextResponse.json<ApiResponse<{ synced: true; imageUrl: googlePictureUrl }>>({
        success: true,
        data: { synced: true, imageUrl: googlePictureUrl },
      });
    }

    // 無法獲取 Google picture
    return NextResponse.json<ApiResponse<{ synced: false; reason: "no_picture_available" }>>({
      success: true,
      data: { synced: false, reason: "no_picture_available" },
    });
  } catch (error) {
    console.error("[Sync Google Avatar] Unexpected error:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "同步 Google 頭像失敗",
      },
      { status: 500 }
    );
  }
}

