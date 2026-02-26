/*
  Warnings:

  - You are about to drop the column `customerName` on the `project` table. All the data in the column will be lost.
  - You are about to drop the column `customerPhone` on the `project` table. All the data in the column will be lost.
  - Added the required column `contactName` to the `project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactPhone` to the `project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "project" DROP COLUMN "customerName",
DROP COLUMN "customerPhone",
ADD COLUMN     "contactName" TEXT NOT NULL,
ADD COLUMN     "contactPhone" TEXT NOT NULL;
