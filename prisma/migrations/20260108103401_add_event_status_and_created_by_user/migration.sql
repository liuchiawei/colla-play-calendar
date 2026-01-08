-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('draft', 'pending', 'published', 'rejected', 'archived');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "status" "EventStatus" NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Event_createdBy_idx" ON "Event"("createdBy");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
