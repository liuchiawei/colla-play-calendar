-- 資料遷移：將 isPublic 轉換為 visibility
-- 如果 isPublic = true，則所有字段設為公開（true）
-- 如果 isPublic = false 或 null，則所有字段設為不公開（false）
UPDATE "profile"
SET "visibility" = CASE
  WHEN "isPublic" = true THEN jsonb_build_object(
    'displayName', true,
    'birthDate', true,
    'gender', true,
    'occupation', true,
    'education', true,
    'skills', true,
    'bio', true
  )
  ELSE jsonb_build_object(
    'displayName', false,
    'birthDate', false,
    'gender', false,
    'occupation', false,
    'education', false,
    'skills', false,
    'bio', false
  )
END
WHERE "visibility" IS NULL;

-- 刪除 isPublic 索引
DROP INDEX IF EXISTS "profile_isPublic_idx";

-- 刪除 isPublic 欄位
ALTER TABLE "profile" DROP COLUMN "isPublic";


