-- Add eventType to project for forward/backward compatibility
ALTER TABLE "project"
ADD COLUMN "eventType" TEXT NOT NULL DEFAULT '其他';

