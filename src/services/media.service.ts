import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/utils/app-error";

export class MediaService {
  async list(userId: string) {
    return prisma.userMedia.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  async create(input: {
    userId: string;
    url: string;
    mediaType: "photo" | "video";
    isPrimary?: boolean;
  }) {
    return prisma.userMedia.create({
      data: {
        userId: input.userId,
        url: input.url,
        mediaType: input.mediaType,
        isPrimary: input.isPrimary ?? false
      }
    });
  }

  async remove(userId: string, mediaId: string) {
    const existing = await prisma.userMedia.findFirst({
      where: { id: mediaId, userId }
    });
    if (!existing) {
      throw new AppError("NOT_FOUND", "Media not found.", 404);
    }

    return prisma.userMedia.delete({
      where: { id: mediaId }
    });
  }
}

export const mediaService = new MediaService();
