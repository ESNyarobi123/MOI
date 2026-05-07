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
}

export const notificationService = new NotificationService();
