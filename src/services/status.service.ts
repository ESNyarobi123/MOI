import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/utils/app-error";

const STATUS_TTL_HOURS = 24;

export class StatusService {
  async create(input: { userId: string; imageUrl: string; caption?: string }) {
    const expiresAt = new Date(Date.now() + STATUS_TTL_HOURS * 60 * 60 * 1000);
    return prisma.userStatus.create({
      data: {
        userId: input.userId,
        imageUrl: input.imageUrl,
        caption: input.caption ?? null,
        expiresAt,
      },
    });
  }

  async listByUser(userId: string) {
    return prisma.userStatus.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
  }

  async feed(userId: string) {
    const matches = await prisma.match.findMany({
      where: {
        isActive: true,
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      select: { userAId: true, userBId: true },
    });

    const partnerIds = matches.map((m) =>
      m.userAId === userId ? m.userBId : m.userAId
    );

    if (partnerIds.length === 0) return [];

    const statuses = await prisma.userStatus.findMany({
      where: {
        userId: { in: partnerIds },
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            profile: { select: { fullName: true } },
            media: {
              where: { isPrimary: true },
              select: { url: true },
              take: 1,
            },
          },
        },
      },
    });

    type GroupedUser = {
      userId: string;
      name: string;
      photoUrl: string | undefined;
      statuses: {
        id: string;
        imageUrl: string;
        caption: string | null;
        createdAt: Date;
        expiresAt: Date;
      }[];
    };

    const grouped = new Map<string, GroupedUser>();
    for (const s of statuses) {
      if (!grouped.has(s.userId)) {
        grouped.set(s.userId, {
          userId: s.userId,
          name: s.user.profile?.fullName ?? "User",
          photoUrl: s.user.media[0]?.url,
          statuses: [],
        });
      }
      grouped.get(s.userId)!.statuses.push({
        id: s.id,
        imageUrl: s.imageUrl,
        caption: s.caption,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      });
    }

    return Array.from(grouped.values());
  }

  async remove(userId: string, statusId: string) {
    const existing = await prisma.userStatus.findFirst({
      where: { id: statusId, userId },
    });
    if (!existing) {
      throw new AppError("NOT_FOUND", "Status not found.", 404);
    }
    return prisma.userStatus.delete({ where: { id: statusId } });
  }

  async incrementViewCount(statusId: string) {
    return prisma.userStatus.update({
      where: { id: statusId },
      data: { viewCount: { increment: 1 } },
    });
  }

  async toggleLike(statusId: string, userId: string) {
    const existing = await prisma.statusLike.findUnique({
      where: { statusId_userId: { statusId, userId } },
    });
    if (existing) {
      await prisma.statusLike.delete({ where: { id: existing.id } });
      return { liked: false };
    }
    await prisma.statusLike.create({ data: { statusId, userId } });
    return { liked: true };
  }

  async getLikeCount(statusId: string) {
    return prisma.statusLike.count({ where: { statusId } });
  }

  async isLikedByUser(statusId: string, userId: string) {
    const like = await prisma.statusLike.findUnique({
      where: { statusId_userId: { statusId, userId } },
    });
    return like != null;
  }

  async cleanup() {
    const result = await prisma.userStatus.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}

export const statusService = new StatusService();
