import { MessageType } from "@prisma/client";
import { moderateTextProduction } from "@/lib/ai/openai-moderate";
import { prisma } from "@/lib/db/prisma";
import { shouldBlurMediaMessage } from "@/lib/safety/media-scan";
import { emitToChatRoom } from "@/lib/socket/emit";
import { desirabilityService } from "@/services/desirability.service";
import { matchingService } from "@/services/matching.service";
import { notificationService } from "@/services/notification.service";
import { AppError } from "@/utils/app-error";

export class ChatService {
  async listMyChats(userId: string, includeArchived = false) {
    return prisma.chatParticipant.findMany({
      where: {
        userId,
        ...(includeArchived ? {} : { isArchived: false })
      },
      include: {
        chat: {
          include: {
            match: true,
            messages: { orderBy: { createdAt: "desc" }, take: 1 }
          }
        }
      }
    });
  }

  async updateParticipantSettings(
    chatId: string,
    userId: string,
    input: { isMuted?: boolean; isArchived?: boolean }
  ) {
    await this.assertCanUseChat(chatId, userId, "read");

    return prisma.chatParticipant.update({
      where: { chatId_userId: { chatId, userId } },
      data: {
        isMuted: input.isMuted ?? undefined,
        isArchived: input.isArchived ?? undefined
      }
    });
  }

  async sendMessage(input: {
    chatId: string;
    senderUserId: string;
    body?: string;
    type: "text" | "image" | "voice_note" | "sticker";
    mediaUrl?: string;
  }) {
    await this.assertCanUseChat(input.chatId, input.senderUserId, "send");

    if (input.type === "text" && input.body) {
      const mod = await moderateTextProduction(input.body);
      if (mod.flagged) {
        throw new AppError(
          "UNPROCESSABLE_ENTITY",
          "Message blocked by safety filters.",
          422,
          { source: mod.source }
        );
      }
    }

    const typeMap: Record<typeof input.type, MessageType> = {
      text: "TEXT",
      image: "IMAGE",
      voice_note: "VOICE_NOTE",
      sticker: "STICKER"
    };

    let isMediaBlurred = false;
    if (input.type === "image" && input.mediaUrl) {
      const scan = await shouldBlurMediaMessage({ type: "image", mediaUrl: input.mediaUrl });
      isMediaBlurred = scan.blur;
    }

    const priorMessageCount = await prisma.message.count({
      where: { chatId: input.chatId }
    });

    const message = await prisma.message.create({
      data: {
        chatId: input.chatId,
        senderUserId: input.senderUserId,
        body: input.body,
        mediaUrl: input.mediaUrl,
        type: typeMap[input.type],
        isMediaBlurred,
        moderationFlag: false
      }
    });

    await prisma.chatParticipant.updateMany({
      where: { chatId: input.chatId },
      data: { ghostingPenaltyMessageId: null }
    });

    if (priorMessageCount === 0) {
      const parts = await prisma.chatParticipant.findMany({
        where: { chatId: input.chatId },
        select: { userId: true }
      });
      const ids = parts.map((p) => p.userId);
      void desirabilityService.rewardFirstConversationMessage(ids).catch(() => undefined);
    }

    this.emitChat("chat:message", input.chatId, {
      id: message.id,
      chatId: message.chatId,
      senderUserId: message.senderUserId,
      type: input.type,
      body: message.body,
      mediaUrl: message.mediaUrl,
      isMediaBlurred: message.isMediaBlurred,
      createdAt: message.createdAt.toISOString()
    });

    const preview =
      input.type === "text" && input.body
        ? input.body
        : `[${input.type.replace("_", " ")}]`;
    const recipients = await prisma.chatParticipant.findMany({
      where: { chatId: input.chatId, userId: { not: input.senderUserId } },
      select: { userId: true }
    });
    for (const r of recipients) {
      void notificationService
        .notifyNewMessage(r.userId, input.chatId, preview)
        .catch(() => undefined);
    }

    return message;
  }

  async startOrGetDirectChat(userId: string, otherUserId: string) {
    const match = await matchingService.ensureActiveMatch(userId, otherUserId);
    if (!match) {
      throw new AppError(
        "FORBIDDEN",
        "Chat is allowed only after both users match.",
        403
      );
    }

    const existing = await prisma.chat.findUnique({
      where: { matchId: match.id }
    });
    if (existing) return existing;

    return prisma.chat.create({
      data: {
        matchId: match.id,
        participants: {
          create: [{ userId }, { userId: otherUserId }]
        }
      }
    });
  }

  /**
   * Latest-first window: without `beforeMessageId`, returns the newest `limit` messages
   * (ascending chronological order). With `beforeMessageId`, returns up to `limit` messages
   * strictly older than that cursor (still ascending within the page).
   */
  async getMessagesWindow(
    chatId: string,
    userId: string,
    opts: { limit: number; beforeMessageId?: string | null }
  ) {
    await this.assertCanUseChat(chatId, userId, "read");

    const limit = Math.min(Math.max(opts.limit, 1), 200);

    let cursorDate: Date | undefined;
    if (opts.beforeMessageId) {
      const cur = await prisma.message.findFirst({
        where: { id: opts.beforeMessageId, chatId }
      });
      if (cur) cursorDate = cur.createdAt;
    }

    const rows = await prisma.message.findMany({
      where: {
        chatId,
        ...(cursorDate ? { createdAt: { lt: cursorDate } } : {})
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const asc = [...page].reverse();

    return { messages: asc, hasMoreOlder: hasMore };
  }

  async markSeen(chatId: string, userId: string) {
    await this.assertCanUseChat(chatId, userId, "read");

    await prisma.chatParticipant.update({
      where: { chatId_userId: { chatId, userId } },
      data: { lastSeenAt: new Date() }
    });

    const result = await prisma.message.updateMany({
      where: { chatId, senderUserId: { not: userId }, isSeen: false },
      data: { isSeen: true, seenAt: new Date() }
    });

    this.emitChat("chat:seen", chatId, { chatId, userId, count: result.count });

    return result;
  }

  async listMyChatsForMobile(userId: string, includeArchived = false) {
    const rows = await prisma.chatParticipant.findMany({
      where: {
        userId,
        ...(includeArchived ? {} : { isArchived: false })
      },
      include: {
        chat: {
          include: {
            match: true,
            messages: { orderBy: { createdAt: "desc" }, take: 1 }
          }
        }
      }
    });

    if (rows.length === 0) return [];

    const chatIds = rows.map((r) => r.chatId);
    const unreadRows = await prisma.message.groupBy({
      by: ["chatId"],
      where: {
        chatId: { in: chatIds },
        senderUserId: { not: userId },
        isSeen: false
      },
      _count: { _all: true }
    });
    const unreadMap = new Map(unreadRows.map((u) => [u.chatId, u._count._all]));

    const otherIds = rows.map((row) => {
      const m = row.chat.match;
      return m.userAId === userId ? m.userBId : m.userAId;
    });
    const profiles = await prisma.userProfile.findMany({
      where: { userId: { in: otherIds } },
      include: {
        user: {
          select: {
            lastSeenAt: true,
            media: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], take: 1 }
          }
        }
      }
    });
    const pmap = new Map(profiles.map((p) => [p.userId, p]));

    const onlineMs = 5 * 60 * 1000;
    const now = Date.now();

    return rows.map((row, i) => {
      const partnerId = otherIds[i]!;
      const prof = pmap.get(partnerId);
      const last = row.chat.messages[0];
      const lastSeen = prof?.user.lastSeenAt;
      return {
        chatId: row.chatId,
        partnerId,
        partnerName: prof?.fullName ?? "Member",
        partnerPhoto: prof?.user.media[0]?.url,
        lastMessage:
          (last?.body && last.body.trim())
            ? last.body
            : last
              ? `[${String(last.type).toLowerCase().replace("_", " ")}]`
              : undefined,
        lastMessageAt: last?.createdAt.toISOString(),
        unreadCount: unreadMap.get(row.chatId) ?? 0,
        isOnline: lastSeen != null && now - lastSeen.getTime() < onlineMs
      };
    });
  }

  async getThreadForMobile(
    chatId: string,
    userId: string,
    query?: { limit?: number; beforeMessageId?: string | null }
  ) {
    const limit = query?.limit ?? 200;
    const { messages, hasMoreOlder } = await this.getMessagesWindow(chatId, userId, {
      limit,
      beforeMessageId: query?.beforeMessageId ?? null
    });

    const membership = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
      include: { chat: { include: { match: true } } }
    });
    if (!membership?.chat?.match) {
      throw new AppError("FORBIDDEN", "You are not part of this chat.", 403);
    }
    const m = membership.chat.match;
    const partnerId = m.userAId === userId ? m.userBId : m.userAId;

    const prof = await prisma.userProfile.findUnique({
      where: { userId: partnerId },
      include: {
        user: {
          select: {
            lastSeenAt: true,
            media: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], take: 1 }
          }
        }
      }
    });
    const lastSeen = prof?.user.lastSeenAt;
    const onlineMs = 5 * 60 * 1000;
    const now = Date.now();

    const mappedMessages = messages.map((msg) => ({
      messageId: msg.id,
      senderId: msg.senderUserId,
      content: msg.body ?? "",
      sentAt: msg.createdAt.toISOString(),
      isMe: msg.senderUserId === userId,
      type: msg.type
    }));

    return {
      items: messages,
      messages: mappedMessages,
      hasMoreOlder,
      chat: {
        chatId,
        partnerId,
        partnerName: prof?.fullName ?? "Member",
        partnerPhoto: prof?.user.media[0]?.url,
        isOnline: lastSeen != null && now - lastSeen.getTime() < onlineMs
      }
    };
  }

  private emitChat(event: string, chatId: string, payload: unknown) {
    emitToChatRoom(chatId, event, payload);
  }

  private async assertCanUseChat(
    chatId: string,
    userId: string,
    mode: "read" | "send"
  ) {
    const membership = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
      include: {
        chat: { include: { match: true } }
      }
    });

    if (!membership?.chat?.match) {
      throw new AppError("FORBIDDEN", "You are not part of this chat.", 403);
    }

    if (!membership.chat.match.isActive) {
      throw new AppError("FORBIDDEN", "This match is no longer active.", 403);
    }

    if (mode === "send" && membership.isArchived) {
      throw new AppError(
        "FORBIDDEN",
        "Unarchive this chat before sending messages.",
        403
      );
    }

    const m = membership.chat.match;
    const otherId = m.userAId === userId ? m.userBId : m.userAId;

    const blocked = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerUserId: userId, blockedUserId: otherId },
          { blockerUserId: otherId, blockedUserId: userId }
        ]
      }
    });
    if (blocked) {
      throw new AppError("FORBIDDEN", "Messaging is blocked between you and this user.", 403);
    }
  }
}

export const chatService = new ChatService();
