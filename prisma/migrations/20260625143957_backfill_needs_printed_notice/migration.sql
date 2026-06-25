-- 將所有舊專案的告示欄位補填為「需要列印」(true)
UPDATE "public"."project" SET "needsPrintedNotice" = true WHERE "needsPrintedNotice" = false;
