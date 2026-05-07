-- Admin / trust & safety flags
ALTER TABLE "User" ADD COLUMN "isBanned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "bannedReason" TEXT;
ALTER TABLE "User" ADD COLUMN "bannedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "accountRiskNote" TEXT;
ALTER TABLE "User" ADD COLUMN "fakeAccountFlag" BOOLEAN NOT NULL DEFAULT false;

-- OpenAI embedding cache per user (cosine boost on matching feed)
CREATE TABLE "UserMatchingVector" (
    "userId" TEXT NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMatchingVector_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "UserMatchingVector" ADD CONSTRAINT "UserMatchingVector_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Default subscription tiers (admin lists plans; Stripe still deferred)
INSERT INTO "SubscriptionPlan" ("id", "code", "name", "amount", "currency", "interval", "createdAt")
VALUES
    ('cmseedplanfree0001', 'free', 'Free', 0, 'USD', 'none', CURRENT_TIMESTAMP),
    ('cmseedplanplus0001', 'plus', 'Plus', 999, 'USD', 'month', CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
