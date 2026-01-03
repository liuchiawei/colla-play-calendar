// 公開個人資料 API Route - GET（取得公開個人資料）
// 根據 visibility 設定，取得指定使用者的公開個人資料
import { NextRequest, NextResponse } from "next/server";
import { getPublicProfile } from "@/lib/services/profile/profile.service";
import type { ApiResponse, PublicProfileDto } from "@/lib/types";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

// GET /api/profiles/[userId] - 取得公開個人資料
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await context.params;

    // 使用 profile service 取得公開個人資料（根據 visibility 過濾字段）
    const publicProfile = await getPublicProfile(userId);

    if (!publicProfile) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "找不到個人資料",
        },
        { status: 404 }
      );
    }

    // 檢查是否有任何公開的字段
    const hasPublicFields =
      publicProfile.displayName !== null ||
      publicProfile.birthDate !== null ||
      publicProfile.gender !== null ||
      publicProfile.occupation !== null ||
      publicProfile.education !== null ||
      publicProfile.skills !== null ||
      publicProfile.bio !== null;

    // 如果沒有任何公開字段，回傳 403
    if (!hasPublicFields) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "此個人資料為非公開",
        },
        { status: 403 }
      );
    }

    return NextResponse.json<ApiResponse<PublicProfileDto>>({
      success: true,
      data: publicProfile,
    });
  } catch (error) {
    console.error("Failed to fetch public profile:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "取得個人資料失敗",
      },
      { status: 500 }
    );
  }
}

