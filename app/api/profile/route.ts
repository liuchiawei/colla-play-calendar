// Profile API Route - GET（取得）、PUT（更新）
// 取得或更新目前登入使用者的個人資料
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/services/auth/auth-server.service";
import { getProfile, updateProfile } from "@/lib/services/profile/profile.service";
import type { ApiResponse, Profile, ProfileUpdateInput, ProfileVisibility } from "@/lib/types";
import { z } from "zod";

// 個人資料更新驗證規則
const profileUpdateSchema = z.object({
  displayName: z.string().max(100).nullable().optional(),
  birthDate: z.string().nullable().optional(), // ISO 格式日期字串
  gender: z
    .enum(["male", "female", "other", "unspecified"])
    .nullable()
    .optional(),
  occupation: z.string().max(200).nullable().optional(),
  education: z.string().max(200).nullable().optional(),
  skills: z.array(z.string()).nullable().optional(),
  bio: z.string().max(100).nullable().optional(),
  extra: z.record(z.string(), z.any()).nullable().optional(),
  visibility: z
    .object({
      displayName: z.boolean().optional(),
      birthDate: z.boolean().optional(),
      gender: z.boolean().optional(),
      occupation: z.boolean().optional(),
      education: z.boolean().optional(),
      skills: z.boolean().optional(),
      bio: z.boolean().optional(),
    })
    .nullable()
    .optional(),
});

// GET /api/profile - 取得目前登入使用者的個人資料
export async function GET(request: NextRequest) {
  try {
    // 使用統一的認證服務檢查登入狀態
    const authResult = await requireAuth(request);

    // 如果未登入，requireAuth 會返回 NextResponse
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId } = authResult;

    // 使用 profile service 取得個人資料（含快取）
    const profile = await getProfile(userId);

    return NextResponse.json<ApiResponse<Profile | null>>({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "取得個人資料失敗",
      },
      { status: 500 }
    );
  }
}

// PUT /api/profile - 更新目前登入使用者的個人資料
export async function PUT(request: NextRequest) {
  try {
    // 使用統一的認證服務檢查登入狀態
    const authResult = await requireAuth(request);

    // 如果未登入，requireAuth 會返回 NextResponse
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId } = authResult;
    const body: ProfileUpdateInput = await request.json();

    // 驗證輸入資料
    const validationResult = profileUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: `驗證錯誤: ${
            validationResult.error.issues[0]?.message || "無效的輸入"
          }`,
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // 檢查簡介字數（100 字以內）
    if (
      validatedData.bio !== undefined &&
      validatedData.bio !== null &&
      validatedData.bio.length > 100
    ) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "簡介必須在 100 字以內",
        },
        { status: 400 }
      );
    }

    // 使用 profile service 更新個人資料（含快取失效）
    const profile = await updateProfile(userId, validatedData);

    return NextResponse.json<ApiResponse<Profile>>({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Failed to update profile:", error);
    const errorMessage =
      error instanceof Error ? error.message : "更新個人資料失敗";
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
