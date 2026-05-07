import { prisma } from "@/lib/db/prisma";

/**
 * Elo-inspired desirability (0-100): likes from higher-scored users move you up more;
 * passes hurt a bit; tier alignment affects feed ranking in matching.service.
 */
const K_LIKE = 4;
const K_PASS = 1.1;
const K_SUPERLIKE_MULT = 1.35;
/** Scale for expected "quality" of a like from giver to receiver (0-100 domain). */
const SCALE = 22;

function clamp(x: number) {
  return Math.max(0, Math.min(100, x));
}

/** Expected fraction of "credit" receiver already has vs giver (chess-style). */
function expected(receiver: number, giver: number) {
  return 1 / (1 + Math.pow(10, (giver - receiver) / SCALE));
}

function computeSwipeDelta(
  Ra: number,
  Rb: number,
  action: "like" | "pass" | "superlike"
): number {
  const E = expected(Rb, Ra);
  if (action === "pass") {
    return -K_PASS * E;
  }
  const mult = action === "superlike" ? K_SUPERLIKE_MULT : 1;
  return K_LIKE * (1 - E) * mult;
}

export class DesirabilityService {
  /**
   * Apply desirability change for one swipe row. Reverts any prior ledger row for the same swipe (re-swipe).
   */
  async applySwipeDesirability(
    swipeId: string,
    targetUserId: string,
    actorUserId: string,
    action: "like" | "pass" | "superlike"
  ): Promise<void> {
    if (targetUserId === actorUserId) return;

    await prisma.$transaction(async (tx) => {
      const prev = await tx.desirabilityAdjustment.findUnique({ where: { swipeId } });
      if (prev) {
        const t = await tx.user.findUnique({
          where: { id: prev.targetUserId },
          select: { desirabilityScore: true }
        });
        if (t) {
          await tx.user.update({
            where: { id: prev.targetUserId },
            data: { desirabilityScore: clamp((t.desirabilityScore ?? 50) - prev.delta) }
          });
        }
        await tx.desirabilityAdjustment.delete({ where: { swipeId } });
      }

      const [actor, target] = await Promise.all([
        tx.user.findUnique({
          where: { id: actorUserId },
          select: { desirabilityScore: true }
        }),
        tx.user.findUnique({
          where: { id: targetUserId },
          select: { desirabilityScore: true }
        })
      ]);
      if (!actor || !target) return;

      const Ra = actor.desirabilityScore ?? 50;
      const Rb = target.desirabilityScore ?? 50;
      const delta = computeSwipeDelta(Ra, Rb, action);

      await tx.user.update({
        where: { id: targetUserId },
        data: { desirabilityScore: clamp(Rb + delta) }
      });
      await tx.desirabilityAdjustment.create({
        data: { swipeId, targetUserId, delta }
      });
    });
  }

  /** Undo last swipe: reverse stored delta before the Swipe row is deleted. */
  async reverseSwipeDesirability(swipeId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const prev = await tx.desirabilityAdjustment.findUnique({ where: { swipeId } });
      if (!prev) return;
      const t = await tx.user.findUnique({
        where: { id: prev.targetUserId },
        select: { desirabilityScore: true }
      });
      if (t) {
        await tx.user.update({
          where: { id: prev.targetUserId },
          data: { desirabilityScore: clamp((t.desirabilityScore ?? 50) - prev.delta) }
        });
      }
      await tx.desirabilityAdjustment.delete({ where: { swipeId } });
    });
  }

  async applyGhostPenalty(userId: string, amount: number): Promise<void> {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { desirabilityScore: true }
    });
    if (!u) return;
    await prisma.user.update({
      where: { id: userId },
      data: { desirabilityScore: clamp((u.desirabilityScore ?? 50) - Math.abs(amount)) }
    });
  }

  /**
   * Right-heavy swiping in a short window -> small penalty (anti-bot / spam swipe).
   */
  async penalizeMassSwiper(actorUserId: string): Promise<void> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rows = await prisma.swipe.groupBy({
      by: ["action"],
      where: {
        actorUserId,
        createdAt: { gte: since }
      },
      _count: { _all: true }
    });

    let likes = 0;
    let passes = 0;
    for (const r of rows) {
      const c = r._count._all;
      if (r.action === "LIKE" || r.action === "SUPERLIKE") likes += c;
      else if (r.action === "PASS") passes += c;
    }
    const total = likes + passes;
    if (total < 72) return;
    const ratio = likes / total;
    if (ratio < 0.93) return;

    const u = await prisma.user.findUnique({
      where: { id: actorUserId },
      select: { desirabilityScore: true }
    });
    if (!u) return;
    await prisma.user.update({
      where: { id: actorUserId },
      data: { desirabilityScore: clamp((u.desirabilityScore ?? 50) - 1.4) }
    });
  }

  /** First real message in a chat - small boost for both (encourages reply, counters ghosting drift). */
  async rewardFirstConversationMessage(userIds: string[]): Promise<void> {
    const unique = [...new Set(userIds)].filter(Boolean);
    if (unique.length < 2) return;
    for (const id of unique) {
      const u = await prisma.user.findUnique({
        where: { id },
        select: { desirabilityScore: true }
      });
      if (!u) continue;
      await prisma.user.update({
        where: { id },
        data: { desirabilityScore: clamp((u.desirabilityScore ?? 50) + 0.22) }
      });
    }
  }
}

export function desirabilityTier(score: number): "rising" | "solid" | "top" {
  if (score >= 63) return "top";
  if (score >= 44) return "solid";
  return "rising";
}

export const desirabilityService = new DesirabilityService();
