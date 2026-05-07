-- CreateTable
CREATE TABLE "DesirabilityAdjustment" (
    "swipeId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "delta" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesirabilityAdjustment_pkey" PRIMARY KEY ("swipeId")
);

-- AlterTable
ALTER TABLE "ChatParticipant" ADD COLUMN "ghostingPenaltyMessageId" TEXT;

-- AddForeignKey
ALTER TABLE "DesirabilityAdjustment" ADD CONSTRAINT "DesirabilityAdjustment_swipeId_fkey" FOREIGN KEY ("swipeId") REFERENCES "Swipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
