import { prisma } from "@/lib/db/prisma";

export class NotificationService {
  async listForUser(userId: string, limit = 50) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit
    });
  }

  async markRead(userId: string, notificationId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() }
    });
  }

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() }
    });
  }

  async notifyNewMatch(matchId: string, userAId: string, userBId: string) {
    const body =
      "You have a new match — open Matches to start chatting.";
    await prisma.notification.createMany({
      data: [
        {
          userId: userAId,
          kind: "MATCH",
          title: "New match",
          body,
          refId: matchId
        },
        {
          userId: userBId,
          kind: "MATCH",
          title: "New match",
          body,
          refId: matchId
        }
      ]
    });
  }

  async notifyNewMessage(recipientUserId: string, chatId: string, preview: string) {
    return prisma.notification.create({
      data: {
        userId: recipientUserId,
        kind: "MESSAGE",
        title: "New message",
        body: preview.slice(0, 160),
        refId: chatId
      }
    });
  }

  async notifyProfileLike(targetUserId: string, actorUserId: string) {
    const actor = await prisma.user.findUnique({
      where: { id: actorUserId },
      include: {
        profile: { select: { fullName: true } },
        media: { where: { isPrimary: true }, select: { url: true }, take: 1 },
      },
    });
    const actorName = actor?.profile?.fullName ?? "Someone";
    const actorPhoto = actor?.media[0]?.url ?? undefined;

    // Avoid duplicate LIKE notification from same actor within 24h
    const recent = await prisma.notification.findFirst({
      where: {
        userId: targetUserId,
        kind: "LIKE",
        actorId: actorUserId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    if (recent) return recent;

    return prisma.notification.create({
      data: {
        userId: targetUserId,
        kind: "LIKE",
        title: `${actorName} likes you`,
        body: `${actorName} liked your profile — check them out!`,
        actorId: actorUserId,
        actorName,
        actorPhoto,
        refId: actorUserId,
      },
    });
  }

  async notifyStatusLike(statusOwnerId: string, actorUserId: string, statusId: string) {
    if (statusOwnerId === actorUserId) return;

    const actor = await prisma.user.findUnique({
      where: { id: actorUserId },
      include: {
        profile: { select: { fullName: true } },
        media: { where: { isPrimary: true }, select: { url: true }, take: 1 },
      },
    });
    const actorName = actor?.profile?.fullName ?? "Someone";
    const actorPhoto = actor?.media[0]?.url ?? undefined;

    return prisma.notification.create({
      data: {
        userId: statusOwnerId,
        kind: "STATUS_LIKE",
        title: `${actorName} liked your story`,
        body: `${actorName} reacted to your story.`,
        actorId: actorUserId,
        actorName,
        actorPhoto,
        refId: statusId,
      },
    });
  }

  async notifySuperLike(targetUserId: string, actorUserId: string) {
    const actor = await prisma.user.findUnique({
      where: { id: actorUserId },
      include: {
        profile: { select: { fullName: true } },
        media: { where: { isPrimary: true }, select: { url: true }, take: 1 },
      },
    });
    const actorName = actor?.profile?.fullName ?? "Someone";
    const actorPhoto = actor?.media[0]?.url ?? undefined;

    return prisma.notification.create({
      data: {
        userId: targetUserId,
        kind: "SUPER_LIKE",
        title: `${actorName} super liked you!`,
        body: `${actorName} sent you a Super Like — they're really into you!`,
        actorId: actorUserId,
        actorName,
        actorPhoto,
        refId: actorUserId,
      },
    });
  }
}

export const notificationService = new NotificationService();
