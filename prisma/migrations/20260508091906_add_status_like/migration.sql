-- CreateTable
CREATE TABLE "StatusLike" (
    "id" TEXT NOT NULL,
    "statusId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StatusLike_statusId_idx" ON "StatusLike"("statusId");

-- CreateIndex
CREATE UNIQUE INDEX "StatusLike_statusId_userId_key" ON "StatusLike"("statusId", "userId");

-- AddForeignKey
ALTER TABLE "StatusLike" ADD CONSTRAINT "StatusLike_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "UserStatus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
