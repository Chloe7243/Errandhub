-- CreateEnum
CREATE TYPE "ErrandStatus" AS ENUM ('POSTED', 'ACCEPTED', 'IN_PROGRESS', 'REVIEWING', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "ErrandType" AS ENUM ('PICKUP_DELIVERY', 'SHOPPING', 'HANDS_ON_HELP');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "stripeAccountId" TEXT,
    "university" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" TEXT,
    "expoPushToken" TEXT,
    "resetToken" TEXT,
    "verificationToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "notificationRadius" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "errandUpdates" BOOLEAN NOT NULL DEFAULT true,
    "newMessages" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Errand" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "helperId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "firstLocation" TEXT NOT NULL,
    "finalLocation" TEXT,
    "locationReference" TEXT,
    "suggestedPrice" DOUBLE PRECISION,
    "agreedPrice" DOUBLE PRECISION,
    "stripePaymentIntentId" TEXT,
    "paymentMethodId" TEXT,
    "estimatedDuration" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3),
    "finalCost" DOUBLE PRECISION,
    "status" "ErrandStatus" NOT NULL DEFAULT 'POSTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "proofImageUrl" TEXT,
    "proofNote" TEXT,
    "completedAt" TIMESTAMP(3),
    "type" "ErrandType" NOT NULL,
    "firstLat" DOUBLE PRECISION,
    "firstLng" DOUBLE PRECISION,
    "finalLat" DOUBLE PRECISION,
    "finalLng" DOUBLE PRECISION,

    CONSTRAINT "Errand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "errandId" TEXT NOT NULL,
    "raisedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "evidenceImageUrl" TEXT,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Errand_stripePaymentIntentId_key" ON "Errand"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_errandId_key" ON "Dispute"("errandId");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Errand" ADD CONSTRAINT "Errand_helperId_fkey" FOREIGN KEY ("helperId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Errand" ADD CONSTRAINT "Errand_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_errandId_fkey" FOREIGN KEY ("errandId") REFERENCES "Errand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
