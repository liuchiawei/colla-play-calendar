/**
 * 個人資料服務 (Profile Service)
 *
 * 提供個人資料相關的業務邏輯處理，包括取得、更新、公開資料查詢等
 * 使用 Next.js unstable_cache 優化性能，減少資料庫查詢
 * 遵循單一職責原則，統一管理個人資料邏輯
 */

import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";
import prisma from "@/lib/prisma";
import type {
  Profile,
  ProfileUpdateInput,
  PublicProfileDto,
  ProfileVisibility,
  EventWithCategory,
  UserWithAdmin,
} from "@/lib/types";

// 可控制的個人資料字段列表
const PROFILE_VISIBILITY_FIELDS = [
  "displayName",
  "birthDate",
  "gender",
  "occupation",
  "education",
  "skills",
  "bio",
] as const;

/**
 * 從資料庫獲取個人資料（內部函數，用於快取）
 *
 * @param userId 用戶 ID
 * @returns Promise<Profile | null>
 */
async function fetchProfileFromDb(userId: string): Promise<Profile | null> {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    return profile;
  } catch (error) {
    console.error("[Profile Service] Failed to fetch profile from DB:", error);
    return null;
  }
}

/**
 * 取得個人資料（帶快取）
 *
 * 使用 Next.js unstable_cache 快取個人資料查詢結果：
 * - 快取 key: `profile-${userId}`
 * - 快取 tag: `profile-${userId}`, `profile`
 * - TTL: 5 分鐘
 *
 * @param userId 用戶 ID
 * @returns Promise<Profile | null>
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  if (!userId) {
    return null;
  }

  try {
    // 使用 unstable_cache 快取個人資料查詢
    const cachedProfile = await unstable_cache(
      async () => fetchProfileFromDb(userId),
      [`profile-${userId}`], // 快取 key
      {
        tags: [`profile-${userId}`, "profile"], // 快取標籤
        revalidate: 300, // 5 分鐘 TTL
      }
    )();

    return cachedProfile;
  } catch (error) {
    console.error("[Profile Service] Failed to get profile:", error);
    return null;
  }
}

/**
 * 更新個人資料
 *
 * 更新後會自動清除相關快取
 *
 * @param userId 用戶 ID
 * @param data 更新資料
 * @returns Promise<Profile>
 */
export async function updateProfile(
  userId: string,
  data: ProfileUpdateInput
): Promise<Profile> {
  // 驗證 visibility 結構（確保只包含允許的字段）
  if (data.visibility) {
    const visibility = data.visibility as ProfileVisibility;
    const allowedFields = new Set(PROFILE_VISIBILITY_FIELDS);

    // 檢查是否有不允許的字段
    for (const field of Object.keys(visibility)) {
      if (
        !allowedFields.has(field as (typeof PROFILE_VISIBILITY_FIELDS)[number])
      ) {
        throw new Error(`不允許的 visibility 字段: ${field}`);
      }
    }
  }

  // 將生日字串轉換為 Date 物件（如果存在）
  const birthDate = data.birthDate ? new Date(data.birthDate) : undefined;

  // 建立或更新個人資料
  const profile = await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      displayName: data.displayName ?? null,
      birthDate: birthDate ?? null,
      gender: data.gender ?? null,
      occupation: data.occupation ?? null,
      education: data.education ?? null,
      skills: data.skills ? (data.skills as any) : null,
      bio: data.bio ?? null,
      extra: data.extra ? (data.extra as any) : null,
      visibility: data.visibility ? (data.visibility as any) : null,
    },
    update: {
      displayName:
        data.displayName !== undefined ? data.displayName : undefined,
      birthDate: birthDate !== undefined ? birthDate : undefined,
      gender: data.gender !== undefined ? data.gender : undefined,
      occupation: data.occupation !== undefined ? data.occupation : undefined,
      education: data.education !== undefined ? data.education : undefined,
      skills: data.skills !== undefined ? (data.skills as any) : undefined,
      bio: data.bio !== undefined ? data.bio : undefined,
      extra: data.extra !== undefined ? (data.extra as any) : undefined,
      visibility:
        data.visibility !== undefined ? (data.visibility as any) : undefined,
    },
  });

  // 清除相關快取
  revalidateTag(`profile-${userId}`, "max");
  revalidateTag("profile", "max");
  revalidateTag(`public-profile-${userId}`, "max");
  revalidateTag("public-profile", "max");

  return profile;
}

/**
 * 根據 visibility 過濾個人資料字段
 *
 * @param profile 個人資料
 * @param visibility 可見性設定
 * @returns PublicProfileDto 過濾後的公開個人資料
 */
export function filterProfileByVisibility(
  profile: Profile,
  visibility: ProfileVisibility | null
): PublicProfileDto {
  const publicProfile: PublicProfileDto = {
    id: profile.id,
    userId: profile.userId,
    displayName: null,
    birthDate: null,
    gender: null,
    occupation: null,
    education: null,
    skills: null,
    bio: null,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };

  // 如果沒有 visibility 設定，則所有字段都不公開
  if (!visibility) {
    return publicProfile;
  }

  // 根據 visibility 設定過濾字段
  if (visibility.displayName && profile.displayName) {
    publicProfile.displayName = profile.displayName;
  }

  if (visibility.birthDate && profile.birthDate) {
    publicProfile.birthDate = profile.birthDate;
  }

  if (visibility.gender && profile.gender) {
    publicProfile.gender = profile.gender;
  }

  if (visibility.occupation && profile.occupation) {
    publicProfile.occupation = profile.occupation;
  }

  if (visibility.education && profile.education) {
    publicProfile.education = profile.education;
  }

  if (visibility.skills && profile.skills) {
    publicProfile.skills = profile.skills as string[] | null;
  }

  if (visibility.bio && profile.bio) {
    publicProfile.bio = profile.bio;
  }

  return publicProfile;
}

/**
 * 從資料庫獲取公開個人資料（內部函數，用於快取）
 *
 * @param userId 用戶 ID
 * @returns Promise<PublicProfileDto | null>
 */
async function fetchPublicProfileFromDb(
  userId: string
): Promise<PublicProfileDto | null> {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return null;
    }

    // 解析 visibility（如果存在）
    const visibility = profile.visibility as ProfileVisibility | null;

    // 根據 visibility 過濾字段
    return filterProfileByVisibility(profile, visibility);
  } catch (error) {
    console.error(
      "[Profile Service] Failed to fetch public profile from DB:",
      error
    );
    return null;
  }
}

/**
 * 取得公開個人資料（帶快取）
 *
 * 根據 visibility 設定過濾字段，只返回用戶允許公開的資料
 * 使用 Next.js unstable_cache 快取查詢結果：
 * - 快取 key: `public-profile-${userId}`
 * - 快取 tag: `public-profile-${userId}`, `public-profile`
 * - TTL: 5 分鐘
 *
 * @param userId 用戶 ID
 * @returns Promise<PublicProfileDto | null>
 */
export async function getPublicProfile(
  userId: string
): Promise<PublicProfileDto | null> {
  if (!userId) {
    return null;
  }

  try {
    // 使用 unstable_cache 快取公開個人資料查詢
    const cachedPublicProfile = await unstable_cache(
      async () => fetchPublicProfileFromDb(userId),
      [`public-profile-${userId}`], // 快取 key
      {
        tags: [`public-profile-${userId}`, "public-profile"], // 快取標籤
        revalidate: 300, // 5 分鐘 TTL
      }
    )();

    return cachedPublicProfile;
  } catch (error) {
    console.error("[Profile Service] Failed to get public profile:", error);
    return null;
  }
}

/**
 * 從資料庫獲取使用者活動紀錄（內部函數，用於快取）
 *
 * @param userId 用戶 ID
 * @returns Promise<EventWithCategory[]>
 */
async function fetchUserEventsFromDb(
  userId: string
): Promise<EventWithCategory[]> {
  try {
    // 查詢使用者的所有報名記錄，包含活動和類別資訊
    // 一次查詢所有資料，避免 N+1 問題
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        userId, // 只查詢登入使用者的報名記錄
      },
      include: {
        event: {
          include: {
            category: true,
            _count: {
              select: { registrations: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc", // 依報名時間降序排列
      },
    });

    // 轉換為 EventWithCategory 格式
    // 所有查詢到的活動都是使用者已報名的，所以 isRegistered 為 true
    return registrations.map((registration) => {
      const { event } = registration;
      const { _count, ...eventData } = event;
      return {
        ...eventData,
        category: event.category,
        registrationCount: _count.registrations,
        isRegistered: true, // 所有查詢到的活動都是已報名的
      };
    });
  } catch (error) {
    console.error(
      "[Profile Service] Failed to fetch user events from DB:",
      error
    );
    return [];
  }
}

/**
 * 取得使用者活動紀錄（帶快取）
 *
 * 使用 Next.js unstable_cache 快取查詢結果：
 * - 快取 key: `user-events-${userId}`
 * - 快取 tag: `user-events-${userId}`, `user-events`
 * - TTL: 60 秒
 *
 * @param userId 用戶 ID
 * @returns Promise<EventWithCategory[]>
 */
export async function getUserEvents(
  userId: string
): Promise<EventWithCategory[]> {
  if (!userId) {
    return [];
  }

  try {
    // 使用 unstable_cache 快取使用者活動查詢
    const cachedUserEvents = await unstable_cache(
      async () => fetchUserEventsFromDb(userId),
      [`user-events-${userId}`], // 快取 key
      {
        tags: [`user-events-${userId}`, "user-events"], // 快取標籤
        revalidate: 60, // 60 秒 TTL
      }
    )();

    return cachedUserEvents;
  } catch (error) {
    console.error("[Profile Service] Failed to get user events:", error);
    return [];
  }
}

/**
 * 從資料庫獲取用戶信息（根據名稱，內部函數，用於快取）
 *
 * @param name 用戶名稱
 * @returns Promise<UserWithAdmin | null>
 */
async function fetchUserByNameFromDb(
  name: string
): Promise<UserWithAdmin | null> {
  try {
    const user = await prisma.user.findFirst({
      where: { name },
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

    return user as UserWithAdmin | null;
  } catch (error) {
    console.error(
      "[Profile Service] Failed to fetch user by name from DB:",
      error
    );
    return null;
  }
}

/**
 * 根據用戶名稱查找用戶（帶快取）
 *
 * 使用 Next.js unstable_cache 快取用戶名稱查詢結果：
 * - 快取 key: `user-by-name-${name}`
 * - 快取 tag: `user-by-name-${name}`, `user-by-name`
 * - TTL: 5 分鐘
 *
 * @param name 用戶名稱
 * @returns Promise<UserWithAdmin | null>
 */
export async function getUserByName(
  name: string
): Promise<UserWithAdmin | null> {
  if (!name) {
    return null;
  }

  try {
    // 使用 unstable_cache 快取用戶名稱查詢
    const cachedUser = await unstable_cache(
      async () => fetchUserByNameFromDb(name),
      [`user-by-name-${name}`], // 快取 key
      {
        tags: [`user-by-name-${name}`, "user-by-name"], // 快取標籤
        revalidate: 300, // 5 分鐘 TTL
      }
    )();

    return cachedUser;
  } catch (error) {
    console.error("[Profile Service] Failed to get user by name:", error);
    return null;
  }
}

/**
 * 從資料庫獲取用戶信息（根據 ID，內部函數，用於快取）
 *
 * @param id 用戶 ID
 * @returns Promise<UserWithAdmin | null>
 */
async function fetchUserByIdFromDb(
  id: string
): Promise<UserWithAdmin | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
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

    return user as UserWithAdmin | null;
  } catch (error) {
    console.error(
      "[Profile Service] Failed to fetch user by id from DB:",
      error
    );
    return null;
  }
}

/**
 * 根據用戶 ID 查找用戶（帶快取）
 *
 * 使用 Next.js unstable_cache 快取用戶 ID 查詢結果：
 * - 快取 key: `user-by-id-${id}`
 * - 快取 tag: `user-by-id-${id}`, `user-by-id`
 * - TTL: 5 分鐘
 *
 * @param id 用戶 ID
 * @returns Promise<UserWithAdmin | null>
 */
export async function getUserById(
  id: string
): Promise<UserWithAdmin | null> {
  if (!id) {
    return null;
  }

  try {
    // 使用 unstable_cache 快取用戶 ID 查詢
    const cachedUser = await unstable_cache(
      async () => fetchUserByIdFromDb(id),
      [`user-by-id-${id}`], // 快取 key
      {
        tags: [`user-by-id-${id}`, "user-by-id"], // 快取標籤
        revalidate: 300, // 5 分鐘 TTL
      }
    )();

    return cachedUser;
  } catch (error) {
    console.error("[Profile Service] Failed to get user by id:", error);
    return null;
  }
}