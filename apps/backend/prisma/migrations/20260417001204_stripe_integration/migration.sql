/*
  Warnings:

  - A unique constraint covering the columns `[stripePaymentIntentId]` on the table `Errand` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Errand" ADD COLUMN     "stripePaymentIntentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Errand_stripePaymentIntentId_key" ON "Errand"("stripePaymentIntentId");
