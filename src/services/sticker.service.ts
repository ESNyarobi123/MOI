import { prisma } from "@/lib/db/prisma";

export class StickerService {
  async listPacks() {
    return prisma.stickerPack.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        stickers: { orderBy: { sortOrder: "asc" } }
      }
    });
  }

  async getPackBySlug(slug: string) {
    return prisma.stickerPack.findFirst({
      where: { slug, isActive: true },
      include: {
        stickers: { orderBy: { sortOrder: "asc" } }
      }
    });
  }
}

export const stickerService = new StickerService();
