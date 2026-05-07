import { prisma } from "@/lib/db/prisma";
import { desirabilityService } from "@/services/desirability.service";

/**
 * Penalize users who leave the other person "on read" for too long after the last inbound message.
 * Idempotent per (chat, user, lastMessageId) via ChatParticipant.ghostingPenaltyMessageId.
 */
export async function runGhostingPenalties(): Promise<{ chatsChecked: number; usersPenalized: number }> {
  const days = Number(process.env.GHOSTING_PENALTY_AFTER_DAYS ?? 4);
  const penalty = Number(process.env.GHOSTING_PENALTY_POINTS ?? 1.2);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const chats = await prisma.chat.findMany({
    where: { match: { isActive: true } },
    select: { id: true }
  });

  let usersPenalized = 0;

  for (const { id: chatId } of chats) {
    const lastMsg = await prisma.message.findFirst({
      where: { chatId },
      orderBy: { createdAt: "desc" },
      select: { id: true, senderUserId: true, createdAt: true }
    });
    if (!lastMsg || lastMsg.createdAt > cutoff) continue;

    const ghostUserId = await prisma.chatParticipant
      .findMany({
        where: { chatId, userId: { not: lastMsg.senderUserId } },
        select: { userId: true, ghostingPenaltyMessageId: true }
      })
      .then((rows) => rows[0]);

    if (!ghostUserId) continue;

    if (ghostUserId.ghostingPenaltyMessageId === lastMsg.id) continue;

    await desirabilityService.applyGhostPenalty(ghostUserId.userId, penalty);
    await prisma.chatParticipant.update({
      where: { chatId_userId: { chatId, userId: ghostUserId.userId } },
      data: { ghostingPenaltyMessageId: lastMsg.id }
    });
    usersPenalized += 1;
  }

  return { chatsChecked: chats.length, usersPenalized };
}
