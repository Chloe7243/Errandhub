/*
  Warnings:

  - You are about to drop the column `complexity` on the `Errand` table. All the data in the column will be lost.
  - You are about to drop the column `helperPayment` on the `Errand` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "Errand" DROP COLUMN "complexity",
DROP COLUMN "helperPayment",
ADD COLUMN     "agreedPrice" DOUBLE PRECISION,
ADD COLUMN     "suggestedPrice" DOUBLE PRECISION;

-- DropEnum
DROP TYPE "Complexity";

-- CreateTable
CREATE TABLE "ErrandBid" (
    "id" TEXT NOT NULL,
    "errandId" TEXT NOT NULL,
    "helperId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "BidStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrandBid_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ErrandBid" ADD CONSTRAINT "ErrandBid_errandId_fkey" FOREIGN KEY ("errandId") REFERENCES "Errand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrandBid" ADD CONSTRAINT "ErrandBid_helperId_fkey" FOREIGN KEY ("helperId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
