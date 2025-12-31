import { auth } from "@/lib/auth"; // path to your auth file
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

// Better Auth のハンドラーを取得
const handlers = toNextJsHandler(auth);

// POST と GET をエクスポート
export const POST = handlers.POST;
export const GET = handlers.GET;

// OPTIONS リクエスト（CORS プリフライト）を処理
export async function OPTIONS(request: NextRequest) {
  // リクエストの Origin を取得
  const origin = request.headers.get("origin");
  
  // CORS ヘッダーを設定
  const headers = new Headers();
  
  // 開発環境では任意の Origin を許可（localhost など）
  // 本番環境では特定の Origin のみ許可
  if (process.env.NODE_ENV === "development") {
    // 開発環境：localhost や 127.0.0.1 を許可
    if (origin && (origin.includes("localhost") || origin.includes("127.0.0.1"))) {
      headers.set("Access-Control-Allow-Origin", origin);
    } else {
      headers.set("Access-Control-Allow-Origin", "*");
    }
  } else {
    // 本番環境：特定の Origin のみ許可
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, ""); // 末尾のスラッシュを削除
    if (origin && allowedOrigin && origin === allowedOrigin) {
      headers.set("Access-Control-Allow-Origin", origin);
    }
  }
  
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Max-Age", "86400"); // 24時間
  
  return new NextResponse(null, {
    status: 204, // No Content
    headers,
  });
}
