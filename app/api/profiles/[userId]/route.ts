// 公開個人資料 API Route - GET（取得公開個人資料）
// 僅在 isPublic=true 時，取得指定使用者的個人資料
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { ApiResponse, PublicProfileDto } from "@/lib/types";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

// GET /api/profiles/[userId] - 取得公開個人資料
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await context.params;

    // 取得個人資料
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "找不到個人資料",
        },
        { status: 404 }
      );
    }

    // 若 isPublic 為 false，回傳 403
    if (!profile.isPublic) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "此個人資料為非公開",
        },
        { status: 403 }
      );
    }

    // 回傳公開用的個人資料（排除 extra 和 visibility）
    const publicProfile: PublicProfileDto = {
      id: profile.id,
      userId: profile.userId,
      displayName: profile.displayName,
      birthDate: profile.birthDate,
      gender: profile.gender,
      occupation: profile.occupation,
      education: profile.education,
      skills: profile.skills as string[] | null,
      bio: profile.bio,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };

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

