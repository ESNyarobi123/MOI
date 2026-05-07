import { MessageType } from "@prisma/client";
import { moderateTextProduction } from "@/lib/ai/openai-moderate";
import { prisma } from "@/lib/db/prisma";
import { shouldBlurMediaMessage } from "@/lib/safety/media-scan";
import { getSocketIo } from "@/lib/socket/io-singleton";
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

  async getMessages(chatId: string, userId: string) {
    await this.assertCanUseChat(chatId, userId, "read");

    return prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
      take: 200
    });
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

  private emitChat(event: string, chatId: string, payload: unknown) {
    getSocketIo()?.to(`chat:${chatId}`).emit(event, payload);
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
