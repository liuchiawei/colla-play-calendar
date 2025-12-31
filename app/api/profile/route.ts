// Profile API Route - GET（取得）、PUT（更新）
// 取得或更新目前登入使用者的個人資料
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { ApiResponse, Profile, ProfileUpdateInput } from "@/lib/types";
import { z } from "zod";

// 個人資料更新驗證規則
const profileUpdateSchema = z.object({
  displayName: z.string().max(100).nullable().optional(),
  birthDate: z.string().nullable().optional(), // ISO 格式日期字串
  gender: z.enum(["male", "female", "other", "unspecified"]).nullable().optional(),
  occupation: z.string().max(200).nullable().optional(),
  education: z.string().max(200).nullable().optional(),
  skills: z.array(z.string()).nullable().optional(),
  bio: z.string().max(100).nullable().optional(),
  isPublic: z.boolean().optional(),
  extra: z.record(z.string(), z.any()).nullable().optional(),
  visibility: z.record(z.string(), z.boolean()).nullable().optional(),
});

// GET /api/profile - 取得目前登入使用者的個人資料
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

    // 取得個人資料（不存在則回傳 null）
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

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
    const body: ProfileUpdateInput = await request.json();

    // 驗證輸入資料
    const validationResult = profileUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: `驗證錯誤: ${validationResult.error.issues[0]?.message || "無效的輸入"}`,
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // 檢查簡介字數（100 字以內）
    if (validatedData.bio !== undefined && validatedData.bio !== null && validatedData.bio.length > 100) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "簡介必須在 100 字以內",
        },
        { status: 400 }
      );
    }

    // 將生日字串轉換為 Date 物件（如果存在）
    const birthDate = validatedData.birthDate
      ? new Date(validatedData.birthDate)
      : undefined;

    // 建立或更新個人資料（不存在則建立，存在則更新）
    const profile = await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        displayName: validatedData.displayName ?? null,
        birthDate: birthDate ?? null,
        gender: validatedData.gender ?? null,
        occupation: validatedData.occupation ?? null,
        education: validatedData.education ?? null,
        skills: validatedData.skills ? (validatedData.skills as any) : null,
        bio: validatedData.bio ?? null,
        isPublic: validatedData.isPublic ?? false,
        extra: validatedData.extra ? (validatedData.extra as any) : null,
        visibility: validatedData.visibility ? (validatedData.visibility as any) : null,
      },
      update: {
        displayName: validatedData.displayName !== undefined ? validatedData.displayName : undefined,
        birthDate: birthDate !== undefined ? birthDate : undefined,
        gender: validatedData.gender !== undefined ? validatedData.gender : undefined,
        occupation: validatedData.occupation !== undefined ? validatedData.occupation : undefined,
        education: validatedData.education !== undefined ? validatedData.education : undefined,
        skills: validatedData.skills !== undefined ? (validatedData.skills as any) : undefined,
        bio: validatedData.bio !== undefined ? validatedData.bio : undefined,
        isPublic: validatedData.isPublic !== undefined ? validatedData.isPublic : undefined,
        extra: validatedData.extra !== undefined ? (validatedData.extra as any) : undefined,
        visibility: validatedData.visibility !== undefined ? (validatedData.visibility as any) : undefined,
      },
    });

    return NextResponse.json<ApiResponse<Profile>>({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "更新個人資料失敗",
      },
      { status: 500 }
    );
  }
}

