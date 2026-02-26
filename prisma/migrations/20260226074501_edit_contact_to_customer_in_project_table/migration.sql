/*
  Warnings:

  - You are about to drop the column `contactName` on the `project` table. All the data in the column will be lost.
  - You are about to drop the column `contactPhone` on the `project` table. All the data in the column will be lost.
  - Added the required column `customerName` to the `project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerPhone` to the `project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "project" DROP COLUMN "contactName",
DROP COLUMN "contactPhone",
ADD COLUMN     "customerName" TEXT NOT NULL,
ADD COLUMN     "customerPhone" TEXT NOT NULL;
