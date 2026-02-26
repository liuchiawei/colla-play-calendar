-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('negotiating', 'deposit_paid');

-- CreateTable
CREATE TABLE "project" (
    "id" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "company" TEXT,
    "taxId" TEXT,
    "eventOrVenueUse" TEXT NOT NULL,
    "totalAttendees" INTEGER,
    "tables" TEXT,
    "chairs" INTEGER,
    "fnbItems" TEXT,
    "projectNotes" TEXT,
    "collaPlayContactId" TEXT NOT NULL,
    "internalNotes" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'negotiating',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_rental" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "startTime" VARCHAR(5) NOT NULL,
    "endTime" VARCHAR(5) NOT NULL,
    "setupMinutesBefore" INTEGER NOT NULL DEFAULT 30,
    "teardownMinutesAfter" INTEGER NOT NULL DEFAULT 30,
    "rentalAmount" INTEGER NOT NULL DEFAULT 0,
    "fnbAmount" INTEGER NOT NULL DEFAULT 0,
    "paidAmount" INTEGER NOT NULL DEFAULT 0,
    "pendingAmount" INTEGER NOT NULL DEFAULT 0,
    "spaceIds" TEXT[],

    CONSTRAINT "project_rental_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_rental_projectId_idx" ON "project_rental"("projectId");

-- CreateIndex
CREATE INDEX "project_rental_date_idx" ON "project_rental"("date");

-- AddForeignKey
ALTER TABLE "project_rental" ADD CONSTRAINT "project_rental_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
