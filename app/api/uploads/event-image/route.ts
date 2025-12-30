// Event Image Upload API Route - POST
// 使用 Vercel Blob 上傳活動圖片
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import type { ApiResponse } from "@/lib/types";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

export async function POST(request: NextRequest) {
  try {
    // 檢查環境變數
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "BLOB_READ_WRITE_TOKEN 環境變數未設定",
        },
        { status: 500 }
      );
    }

    // 解析 multipart/form-data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "未提供檔案",
        },
        { status: 400 }
      );
    }

    // 驗證檔案類型
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "不支援的檔案類型。僅允許：JPEG, PNG, GIF, WebP",
        },
        { status: 400 }
      );
    }

    // 驗證檔案大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: `檔案大小超過限制（最大 ${MAX_FILE_SIZE / 1024 / 1024}MB）`,
        },
        { status: 400 }
      );
    }

    // 生成唯一檔名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop() || "jpg";
    const filename = `event-${timestamp}-${randomStr}.${fileExtension}`;

    // 上傳到 Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json<ApiResponse<{ url: string; pathname: string }>>(
      {
        success: true,
        data: {
          url: blob.url,
          pathname: blob.pathname,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to upload image:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "圖片上傳失敗",
      },
      { status: 500 }
    );
  }
}
