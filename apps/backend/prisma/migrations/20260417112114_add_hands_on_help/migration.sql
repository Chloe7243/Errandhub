/*
  Warnings:

  - You are about to drop the `PaymentMethod` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PaymentTransaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "ErrandType" ADD VALUE 'HANDS_ON_HELP';

-- DropForeignKey
ALTER TABLE "PaymentMethod" DROP CONSTRAINT "PaymentMethod_userId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentTransaction" DROP CONSTRAINT "PaymentTransaction_errandId_fkey";

-- AlterTable
ALTER TABLE "Errand" ADD COLUMN     "estimatedDuration" DOUBLE PRECISION,
ADD COLUMN     "finalCost" DOUBLE PRECISION,
ADD COLUMN     "paymentMethodId" TEXT,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ALTER COLUMN "dropoffLocation" DROP NOT NULL;

-- DropTable
DROP TABLE "PaymentMethod";

-- DropTable
DROP TABLE "PaymentTransaction";

-- DropEnum
DROP TYPE "PaymentStatus";
