import { prisma } from "@/lib/db/prisma";
import { matchingVectorService } from "@/services/matching-vector.service";
import { AppError } from "@/utils/app-error";

export class MediaService {
  async list(userId: string) {
    return prisma.userMedia.findMany({
      where: { userId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }]
    });
  }

  async count(userId: string) {
    return prisma.userMedia.count({ where: { userId } });
  }

  async create(input: {
    userId: string;
    url: string;
    mediaType: "photo" | "video";
    isPrimary?: boolean;
  }) {
    const row = await prisma.userMedia.create({
      data: {
        userId: input.userId,
        url: input.url,
        mediaType: input.mediaType,
        isPrimary: input.isPrimary ?? false
      }
    });
    matchingVectorService.scheduleSync(input.userId);
    return row;
  }

  async setPrimary(userId: string, mediaId: string) {
    const existing = await prisma.userMedia.findFirst({
      where: { id: mediaId, userId }
    });
    if (!existing) {
      throw new AppError("NOT_FOUND", "Media not found.", 404);
    }

    await prisma.$transaction([
      prisma.userMedia.updateMany({ where: { userId }, data: { isPrimary: false } }),
      prisma.userMedia.update({ where: { id: mediaId }, data: { isPrimary: true } })
    ]);
    matchingVectorService.scheduleSync(userId);
    return prisma.userMedia.findFirst({ where: { id: mediaId, userId } });
  }

  async remove(userId: string, mediaId: string) {
    const existing = await prisma.userMedia.findFirst({
      where: { id: mediaId, userId }
    });
    if (!existing) {
      throw new AppError("NOT_FOUND", "Media not found.", 404);
    }

    const deleted = await prisma.userMedia.delete({
      where: { id: mediaId }
    });

    if (existing.isPrimary) {
      const next = await prisma.userMedia.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" }
      });
      if (next) {
        await prisma.userMedia.update({
          where: { id: next.id },
          data: { isPrimary: true }
        });
      }
    }

    matchingVectorService.scheduleSync(userId);
    return deleted;
  }
}

export const mediaService = new MediaService();
