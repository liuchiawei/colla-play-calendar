-- 活動總人數、椅子數改為文字：相容 TBC、描述等；既有整數以字串保留
ALTER TABLE "project" ALTER COLUMN "totalAttendees" SET DATA TYPE TEXT USING (
  CASE WHEN "totalAttendees" IS NULL THEN NULL ELSE "totalAttendees"::TEXT END
);
ALTER TABLE "project" ALTER COLUMN "chairs" SET DATA TYPE TEXT USING (
  CASE WHEN "chairs" IS NULL THEN NULL ELSE "chairs"::TEXT END
);
