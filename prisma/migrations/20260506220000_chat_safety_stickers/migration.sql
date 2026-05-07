-- AlterTable
ALTER TABLE "ChatParticipant" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN "isMediaBlurred" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "StickerPack" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StickerPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sticker" (
    "id" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sticker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StickerPack_slug_key" ON "StickerPack"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Sticker_packId_code_key" ON "Sticker"("packId", "code");

-- AddForeignKey
ALTER TABLE "Sticker" ADD CONSTRAINT "Sticker_packId_fkey" FOREIGN KEY ("packId") REFERENCES "StickerPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default sticker pack (CDN URLs are placeholders; replace in admin/CMS later)
INSERT INTO "StickerPack" ("id", "slug", "name", "isActive", "createdAt", "updatedAt")
VALUES ('clstickpack_default001', 'default', 'MoiDate default', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "Sticker" ("id", "packId", "code", "imageUrl", "sortOrder", "createdAt", "updatedAt") VALUES
('clsticker_wave001', 'clstickpack_default001', 'wave', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f44b.png', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('clsticker_heart001', 'clstickpack_default001', 'heart', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2764-fe0f.png', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('clsticker_laugh001', 'clstickpack_default001', 'laugh', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f602.png', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('clsticker_fire001', 'clstickpack_default001', 'fire', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f525.png', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
