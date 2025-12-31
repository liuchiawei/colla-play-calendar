// 活動報名相關工具函數
// 匿名セッション管理とユーザー識別

import { cookies } from "next/headers";
import { randomBytes } from "crypto";

const ANON_SESSION_COOKIE_NAME = "anon_session_id";
const ANON_SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1年

/**
 * 匿名セッションIDを取得または生成
 * クッキーから読み取るか、存在しない場合は新規生成
 */
export async function getOrCreateAnonymousSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(ANON_SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    // 新規生成：anon_ プレフィックス + ランダム文字列
    sessionId = `anon_${randomBytes(16).toString("hex")}`;
    
    // クッキーに保存
    cookieStore.set(ANON_SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ANON_SESSION_MAX_AGE,
      path: "/",
    });
  }

  return sessionId;
}

/**
 * 匿名セッションIDを取得（生成しない）
 */
export async function getAnonymousSessionId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ANON_SESSION_COOKIE_NAME)?.value;
}


