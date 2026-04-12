/*
  Warnings:

  - You are about to drop the `ErrandBid` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- DropForeignKey
ALTER TABLE "ErrandBid" DROP CONSTRAINT "ErrandBid_errandId_fkey";

-- DropForeignKey
ALTER TABLE "ErrandBid" DROP CONSTRAINT "ErrandBid_helperId_fkey";

-- DropTable
DROP TABLE "ErrandBid";

-- DropEnum
DROP TYPE "BidStatus";

-- CreateTable
CREATE TABLE "ErrandOffer" (
    "id" TEXT NOT NULL,
    "errandId" TEXT NOT NULL,
    "helperId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrandOffer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ErrandOffer" ADD CONSTRAINT "ErrandOffer_errandId_fkey" FOREIGN KEY ("errandId") REFERENCES "Errand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrandOffer" ADD CONSTRAINT "ErrandOffer_helperId_fkey" FOREIGN KEY ("helperId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
