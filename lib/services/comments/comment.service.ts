/**
 * 留言服務 (Comment Service)
 *
 * 提供留言相關的業務邏輯處理，包括取得、建立、更新、刪除留言和按讚功能
 * 使用 Next.js unstable_cache 優化性能，減少資料庫查詢
 */

import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";
import { createHash } from "crypto";
import prisma from "@/lib/prisma";
import type {
  CommentWithRelations,
  CommentInput,
  CommentUpdateInput,
  CommentListResponse,
  CommentLikeResponse,
} from "@/lib/types";

/**
 * 為匿名用戶生成顯示編號
 * 基於 anonymousSessionId 和 eventId 的 hash 值，確保同一匿名用戶在同一活動中顯示相同編號
 *
 * @param anonymousSessionId 匿名用戶 session ID
 * @param eventId 活動 ID
 * @returns 編號（1-9999）
 */
function generateAnonymousDisplayNumber(
  anonymousSessionId: string,
  eventId: string
): number {
  const hash = createHash("md5")
    .update(`${anonymousSessionId}-${eventId}`)
    .digest("hex");
  // 將 hash 的前 4 個字符轉換為數字，範圍 1-9999
  const number = (parseInt(hash.substring(0, 4), 16) % 9999) + 1;
  return number;
}

/**
 * 從資料庫獲取活動留言列表（內部函數，用於快取）
 *
 * @param eventId 活動 ID
 * @param page 頁碼（從 1 開始）
 * @param pageSize 每頁數量
 * @param currentUserId 當前用戶 ID（可選，用於判斷是否已按讚）
 * @param currentAnonymousSessionId 當前匿名用戶 session ID（可選）
 * @returns Promise<CommentListResponse>
 */
async function fetchCommentsFromDb(
  eventId: string,
  page: number = 1,
  pageSize: number = 20,
  currentUserId?: string | null,
  currentAnonymousSessionId?: string | null
): Promise<CommentListResponse> {
  try {
    // 計算跳過數量
    const skip = (page - 1) * pageSize;

    // 獲取總數（僅頂層留言，不包含回覆）
    const total = await prisma.comment.count({
      where: {
        eventId,
        parentId: null, // 只計算頂層留言
      },
    });

    // 獲取頂層留言列表
    const topLevelComments = await prisma.comment.findMany({
      where: {
        eventId,
        parentId: null, // 只獲取頂層留言
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: pageSize,
    });

    // 獲取所有頂層留言的 ID
    const topLevelCommentIds = topLevelComments.map((c) => c.id);

    // 批次獲取所有回覆（最多 3 層深度）
    const allReplies = await prisma.comment.findMany({
      where: {
        eventId,
        parentId: {
          not: null,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // 批次查詢當前用戶的按讚狀態
    const likedCommentIds = new Set<string>();
    if (currentUserId || currentAnonymousSessionId) {
      const likes = await prisma.commentLike.findMany({
        where: {
          commentId: {
            in: [...topLevelCommentIds, ...allReplies.map((r) => r.id)],
          },
          OR: [
            currentUserId ? { userId: currentUserId } : { id: "" },
            currentAnonymousSessionId
              ? { anonymousSessionId: currentAnonymousSessionId }
              : { id: "" },
          ],
        },
        select: {
          commentId: true,
        },
      });
      likes.forEach((like) => likedCommentIds.add(like.commentId));
    }

    // 構建留言樹狀結構
    const buildCommentTree = (
      comments: typeof topLevelComments
    ): CommentWithRelations[] => {
      return comments.map((comment) => {
        // 獲取該留言的所有直接回覆
        const directReplies = allReplies.filter(
          (reply) => reply.parentId === comment.id
        );

        // 遞迴構建回覆樹（最多 3 層）
        const buildRepliesTree = (
          replies: typeof allReplies,
          parentId: string,
          depth: number = 1
        ): CommentWithRelations[] => {
          if (depth > 3) return []; // 限制深度為 3 層

          const children = replies.filter((r) => r.parentId === parentId);
          return children.map((reply) => ({
            ...reply,
            likes: [],
            isLiked: likedCommentIds.has(reply.id),
            replies: buildRepliesTree(replies, reply.id, depth + 1),
          }));
        };

        return {
          ...comment,
          likes: [],
          isLiked: likedCommentIds.has(comment.id),
          replies: buildRepliesTree(allReplies, comment.id),
        };
      });
    };

    const comments = buildCommentTree(topLevelComments);

    return {
      comments,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error("[Comment Service] Failed to fetch comments from DB:", error);
    return {
      comments: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }
}

/**
 * 獲取活動留言列表（帶快取）
 *
 * @param eventId 活動 ID
 * @param page 頁碼（從 1 開始）
 * @param pageSize 每頁數量
 * @param currentUserId 當前用戶 ID（可選）
 * @param currentAnonymousSessionId 當前匿名用戶 session ID（可選）
 * @returns Promise<CommentListResponse>
 */
export async function getCommentsByEventId(
  eventId: string,
  page: number = 1,
  pageSize: number = 20,
  currentUserId?: string | null,
  currentAnonymousSessionId?: string | null
): Promise<CommentListResponse> {
  if (!eventId) {
    return {
      comments: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  try {
    // 使用 unstable_cache 快取留言列表查詢
    const cachedComments = await unstable_cache(
      async () =>
        fetchCommentsFromDb(
          eventId,
          page,
          pageSize,
          currentUserId,
          currentAnonymousSessionId
        ),
      [
        `event-comments-${eventId}-${page}-${pageSize}-${
          currentUserId || currentAnonymousSessionId || "anon"
        }`,
      ], // 快取 key
      {
        tags: [`event-comments-${eventId}`, "event-comments"], // 快取標籤
        revalidate: 300, // 5 分鐘 TTL
      }
    )();

    return cachedComments;
  } catch (error) {
    console.error("[Comment Service] Failed to get comments:", error);
    return {
      comments: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }
}

/**
 * 建立留言
 *
 * @param eventId 活動 ID
 * @param data 留言資料
 * @param userId 用戶 ID（可選）
 * @param anonymousSessionId 匿名用戶 session ID（可選）
 * @returns Promise<CommentWithRelations>
 */
export async function createComment(
  eventId: string,
  data: CommentInput,
  userId?: string | null,
  anonymousSessionId?: string | null
): Promise<CommentWithRelations> {
  // 驗證必須有 userId 或 anonymousSessionId
  if (!userId && !anonymousSessionId) {
    throw new Error("必須提供 userId 或 anonymousSessionId");
  }

  // 如果提供 parentId，驗證父留言存在且屬於同一活動
  if (data.parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: data.parentId },
      select: { eventId: true },
    });

    if (!parentComment) {
      throw new Error("父留言不存在");
    }

    if (parentComment.eventId !== eventId) {
      throw new Error("父留言不屬於此活動");
    }
  }

  // 為匿名用戶生成顯示編號
  let anonymousDisplayNumber: number | null = null;
  if (anonymousSessionId && !userId) {
    anonymousDisplayNumber = generateAnonymousDisplayNumber(
      anonymousSessionId,
      eventId
    );
  }

  // 建立留言
  const comment = await prisma.comment.create({
    data: {
      eventId,
      parentId: data.parentId || null,
      content: data.content,
      userId: userId || null,
      anonymousSessionId: anonymousSessionId || null,
      anonymousDisplayNumber,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      _count: {
        select: {
          likes: true,
          replies: true,
        },
      },
    },
  });

  // 清除相關快取
  revalidateTag(`event-comments-${eventId}`, "max");
  revalidateTag("event-comments", "max");

  return {
    ...comment,
    likes: [],
    isLiked: false,
    replies: [],
  };
}

/**
 * 更新留言
 *
 * @param commentId 留言 ID
 * @param data 更新資料
 * @param userId 用戶 ID（可選，用於驗證作者身份）
 * @param anonymousSessionId 匿名用戶 session ID（可選，用於驗證作者身份）
 * @returns Promise<CommentWithRelations>
 */
export async function updateComment(
  commentId: string,
  data: CommentUpdateInput,
  userId?: string | null,
  anonymousSessionId?: string | null
): Promise<CommentWithRelations> {
  // 獲取留言
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new Error("留言不存在");
  }

  // 驗證作者身份
  if (userId && comment.userId !== userId) {
    throw new Error("無權限修改此留言");
  }

  if (anonymousSessionId && comment.anonymousSessionId !== anonymousSessionId) {
    throw new Error("無權限修改此留言");
  }

  if (!userId && !anonymousSessionId) {
    throw new Error("必須提供 userId 或 anonymousSessionId");
  }

  // 更新留言
  const updatedComment = await prisma.comment.update({
    where: { id: commentId },
    data: {
      content: data.content,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      _count: {
        select: {
          likes: true,
          replies: true,
        },
      },
    },
  });

  // 清除相關快取
  revalidateTag(`event-comments-${comment.eventId}`, "max");
  revalidateTag("event-comments", "max");

  return {
    ...updatedComment,
    likes: [],
    isLiked: false,
    replies: [],
  };
}

/**
 * 刪除留言（級聯刪除回覆和按讚）
 *
 * @param commentId 留言 ID
 * @param userId 用戶 ID（可選，用於驗證作者身份）
 * @param anonymousSessionId 匿名用戶 session ID（可選，用於驗證作者身份）
 * @returns Promise<void>
 */
export async function deleteComment(
  commentId: string,
  userId?: string | null,
  anonymousSessionId?: string | null
): Promise<void> {
  // 獲取留言
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { eventId: true, userId: true, anonymousSessionId: true },
  });

  if (!comment) {
    throw new Error("留言不存在");
  }

  // 驗證作者身份
  if (userId && comment.userId !== userId) {
    throw new Error("無權限刪除此留言");
  }

  if (anonymousSessionId && comment.anonymousSessionId !== anonymousSessionId) {
    throw new Error("無權限刪除此留言");
  }

  if (!userId && !anonymousSessionId) {
    throw new Error("必須提供 userId 或 anonymousSessionId");
  }

  // 刪除留言（級聯刪除回覆和按讚）
  await prisma.comment.delete({
    where: { id: commentId },
  });

  // 清除相關快取
  revalidateTag(`event-comments-${comment.eventId}`, "max");
  revalidateTag("event-comments", "max");
}

/**
 * 切換留言按讚狀態
 *
 * @param commentId 留言 ID
 * @param userId 用戶 ID（可選）
 * @param anonymousSessionId 匿名用戶 session ID（可選）
 * @returns Promise<CommentLikeResponse>
 */
export async function toggleCommentLike(
  commentId: string,
  userId?: string | null,
  anonymousSessionId?: string | null
): Promise<CommentLikeResponse> {
  // 驗證必須有 userId 或 anonymousSessionId
  if (!userId && !anonymousSessionId) {
    throw new Error("必須提供 userId 或 anonymousSessionId");
  }

  // 檢查留言是否存在
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, eventId: true },
  });

  if (!comment) {
    throw new Error("留言不存在");
  }

  // 查詢是否已按讚
  const existingLike = await prisma.commentLike.findFirst({
    where: {
      commentId,
      OR: [
        userId ? { userId } : { id: "" },
        anonymousSessionId ? { anonymousSessionId } : { id: "" },
      ],
    },
  });

  if (existingLike) {
    // 取消按讚
    await prisma.commentLike.delete({
      where: { id: existingLike.id },
    });
  } else {
    // 按讚
    await prisma.commentLike.create({
      data: {
        commentId,
        userId: userId || null,
        anonymousSessionId: anonymousSessionId || null,
      },
    });
  }

  // 獲取更新後的按讚數
  const likeCount = await prisma.commentLike.count({
    where: { commentId },
  });

  // 清除相關快取
  revalidateTag(`event-comments-${comment.eventId}`, "max");
  revalidateTag("event-comments", "max");

  return {
    isLiked: !existingLike,
    likeCount,
  };
}

/**
 * 獲取留言的回覆列表
 *
 * @param commentId 留言 ID
 * @param page 頁碼（從 1 開始）
 * @param pageSize 每頁數量
 * @param currentUserId 當前用戶 ID（可選）
 * @param currentAnonymousSessionId 當前匿名用戶 session ID（可選）
 * @returns Promise<CommentListResponse>
 */
export async function getCommentReplies(
  commentId: string,
  page: number = 1,
  pageSize: number = 20,
  currentUserId?: string | null,
  currentAnonymousSessionId?: string | null
): Promise<CommentListResponse> {
  // 驗證留言存在
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, eventId: true },
  });

  if (!comment) {
    throw new Error("留言不存在");
  }

  // 計算跳過數量
  const skip = (page - 1) * pageSize;

  // 獲取總數
  const total = await prisma.comment.count({
    where: {
      parentId: commentId,
    },
  });

  // 獲取回覆列表
  const replies = await prisma.comment.findMany({
    where: {
      parentId: commentId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      _count: {
        select: {
          likes: true,
          replies: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    skip,
    take: pageSize,
  });

  // 批次查詢當前用戶的按讚狀態
  const likedCommentIds = new Set<string>();
  if (currentUserId || currentAnonymousSessionId) {
    const likes = await prisma.commentLike.findMany({
      where: {
        commentId: {
          in: replies.map((r) => r.id),
        },
        OR: [
          currentUserId ? { userId: currentUserId } : { id: "" },
          currentAnonymousSessionId
            ? { anonymousSessionId: currentAnonymousSessionId }
            : { id: "" },
        ],
      },
      select: {
        commentId: true,
      },
    });
    likes.forEach((like) => likedCommentIds.add(like.commentId));
  }

  const commentsWithLikes: CommentWithRelations[] = replies.map((reply) => ({
    ...reply,
    likes: [],
    isLiked: likedCommentIds.has(reply.id),
    replies: [], // 回覆列表不包含嵌套回覆
  }));

  return {
    comments: commentsWithLikes,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
