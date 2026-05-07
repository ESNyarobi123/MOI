import type { Prisma } from "@prisma/client";
import { SwipeAction } from "@prisma/client";
import { applyPineconeBoost } from "@/lib/ai/pinecone-boost";
import { haversineKm } from "@/lib/location/geo";
import { prisma } from "@/lib/db/prisma";
import { desirabilityService } from "@/services/desirability.service";
import { notificationService } from "@/services/notification.service";
import { userService } from "@/services/user.service";
import { AppError } from "@/utils/app-error";

export type MatchCandidate = {
  userId: string;
  fullName: string;
  age: number;
  gender: string;
  city: string;
  country: string;
  compatibilityScore: number;
  distanceKm: number | null;
  bio?: string;
  photoUrl?: string;
  /** Up to 6 gallery URLs for carousel (primary first). */
  galleryPhotos?: string[];
  tags?: string[];
  /** Interest labels you share with this person (for highlights). */
  commonInterests?: string[];
  isVerified?: boolean;
  /** Seen online in the last ~5 minutes (lastSeenAt). */
  isOnline?: boolean;
  /** Account created within the last 48h. */
  isNewMember?: boolean;
};

type SwipeInput = {
  actorUserId: string;
  targetUserId: string;
  action: "like" | "pass" | "superlike";
};

export type FeedOptions = {
  /** When true, skip geo / km filtering (countrywide discovery). */
  countrywide?: boolean;
  /** Max distance in km (clamped 2–200 server-side). Ignored if countrywide. */
  radiusKm?: number;
  /** Optional age window (inclusive). */
  minAge?: number;
  maxAge?: number;
  /** When set and not ALL, only return profiles with this Gender enum value. */
  preferGender?: string;
};

function ageFromDob(dob: Date) {
  const y = new Date().getFullYear() - dob.getFullYear();
  return Math.max(18, y);
}

function isPositiveAction(action: SwipeAction | undefined) {
  return action === "LIKE" || action === "SUPERLIKE";
}

export class MatchingService {
  async getFeed(userId: string, options: FeedOptions = {}): Promise<MatchCandidate[]> {
    await userService.ensureLegacyAgeBackfillByUserId(userId);

    const actor = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        interests: { include: { interest: true } }
      }
    });

    if (!actor?.profile) {
      throw new AppError("NOT_FOUND", "Complete your profile before discovering people.", 404);
    }

    const blocks = await prisma.userBlock.findMany({
      where: {
        OR: [{ blockerUserId: userId }, { blockedUserId: userId }]
      }
    });
    const blockedIds = new Set<string>();
    for (const b of blocks) {
      blockedIds.add(b.blockerUserId === userId ? b.blockedUserId : b.blockerUserId);
    }

    const swipes = await prisma.swipe.findMany({
      where: { actorUserId: userId },
      select: { targetUserId: true }
    });
    const swipedIds = new Set(swipes.map((s) => s.targetUserId));

    const likesToMe = await prisma.swipe.findMany({
      where: {
        targetUserId: userId,
        action: { in: ["LIKE", "SUPERLIKE"] }
      },
      select: { actorUserId: true }
    });
    const likedMeIds = new Set(likesToMe.map((s) => s.actorUserId));

    const excludeIds = [userId, ...blockedIds, ...swipedIds];
    const where: Prisma.UserWhereInput = {
      id: { notIn: excludeIds },
      isActive: true,
      isSuspended: false,
      emailVerified: true,
      isAgeVerified: true,
      profile: { is: { showProfile: true } }
    };

    const candidates = await prisma.user.findMany({
      where,
      include: {
        profile: true,
        interests: { include: { interest: true } },
        media: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], take: 6 },
        verificationRecords: { where: { status: "APPROVED" }, take: 1 }
      },
      take: 200
    });

    const candIds = candidates.map((c) => c.id);
    const recvAgg =
      candIds.length > 0
        ? await prisma.swipe.groupBy({
            by: ["targetUserId", "action"],
            where: { targetUserId: { in: candIds } },
            _count: { _all: true }
          })
        : [];
    const recvMap = new Map<string, { likes: number; passes: number }>();
    for (const row of recvAgg) {
      const cur = recvMap.get(row.targetUserId) ?? { likes: 0, passes: 0 };
      if (row.action === "LIKE" || row.action === "SUPERLIKE") cur.likes += row._count._all;
      else if (row.action === "PASS") cur.passes += row._count._all;
      recvMap.set(row.targetUserId, cur);
    }

    const Sa = actor.desirabilityScore ?? 50;

    const countrywide = Boolean(options.countrywide);
    const rawRadius = options.radiusKm ?? actor.profile.distanceKm ?? 50;
    const maxKm = countrywide ? undefined : Math.min(200, Math.max(2, Math.round(rawRadius)));

    const minAgeOpt =
      options.minAge != null
        ? Math.min(99, Math.max(18, Math.round(options.minAge)))
        : undefined;
    const maxAgeOpt =
      options.maxAge != null
        ? Math.min(99, Math.max(18, Math.round(options.maxAge)))
        : undefined;
    let minAge = minAgeOpt;
    let maxAge = maxAgeOpt;
    if (minAge != null && maxAge != null && minAge > maxAge) {
      const t = minAge;
      minAge = maxAge;
      maxAge = t;
    }
    const preferGender =
      options.preferGender &&
      options.preferGender !== "ALL" &&
      ["MALE", "FEMALE", "NON_BINARY", "OTHER"].includes(options.preferGender)
        ? options.preferGender
        : undefined;

    const actorInterestLabels = new Set(actor.interests.map((i) => i.interest.label));
    const actorInterestIds = new Set(actor.interests.map((i) => i.interestId));
    const actorLooking = new Set(actor.profile.lookingFor);
    const actorAge = ageFromDob(actor.profile.dateOfBirth);
    const aLat = actor.profile.lat;
    const aLng = actor.profile.lng;

    const scored: MatchCandidate[] = [];

    for (const u of candidates) {
      if (!u.profile) continue;

      const candAge = ageFromDob(u.profile.dateOfBirth);
      if (minAge != null && candAge < minAge) continue;
      if (maxAge != null && candAge > maxAge) continue;
      if (preferGender && u.profile.gender !== preferGender) continue;

      let distanceKm: number | null = null;
      if (
        aLat != null &&
        aLng != null &&
        u.profile.lat != null &&
        u.profile.lng != null &&
        !u.profile.hideExactLocation &&
        !actor.profile.hideExactLocation
      ) {
        distanceKm = haversineKm(aLat, aLng, u.profile.lat, u.profile.lng);
      }

      if (!countrywide && maxKm != null) {
        if (distanceKm != null) {
          if (distanceKm > maxKm) continue;
        } else {
          if (maxKm < 50 && u.profile.city !== actor.profile.city) continue;
          if (maxKm >= 50 && u.profile.country !== actor.profile.country) continue;
        }
      }

      const candInterestIds = u.interests.map((i) => i.interestId);
      const overlap = candInterestIds.filter((id) => actorInterestIds.has(id)).length;
      const union = new Set([...actorInterestIds, ...candInterestIds]).size;
      const jaccard = union ? overlap / union : 0;

      const lfOverlap = u.profile.lookingFor.filter((x) => actorLooking.has(x)).length;
      const lfScore = actorLooking.size
        ? Math.min(1, lfOverlap / actorLooking.size)
        : 0.5;

      let distScore = 0.2;
      if (distanceKm != null && maxKm != null && maxKm > 0) {
        distScore = 1 - Math.min(1, distanceKm / maxKm);
      } else if (u.profile.city === actor.profile.city) {
        distScore = 0.6;
      }

      const ageScore = 1 - Math.min(1, Math.abs(actorAge - candAge) / 25);

      let compatibilityScore =
        jaccard * 0.42 + lfScore * 0.28 + distScore * 0.25 + ageScore * 0.05;

      // Reciprocal interest: they already liked you → surface them sooner (match funnel)
      if (likedMeIds.has(u.id)) {
        compatibilityScore += 0.18;
      }

      // Newbie boost (~48h): new profiles get extra visibility (retention / dopamine loop)
      const accountAgeMs = Date.now() - u.createdAt.getTime();
      if (accountAgeMs >= 0 && accountAgeMs < 48 * 60 * 60 * 1000) {
        compatibilityScore += 0.12;
      }

      // Activity: recently online → slight priority
      if (u.lastSeenAt) {
        const seenMs = Date.now() - u.lastSeenAt.getTime();
        if (seenMs >= 0 && seenMs < 30 * 60 * 1000) {
          compatibilityScore += 0.05;
        }
      }

      const Sb = u.desirabilityScore ?? 50;
      const recv = recvMap.get(u.id) ?? { likes: 0, passes: 0 };
      const denom = recv.likes + recv.passes + 8;
      const receiveRatio = recv.likes / denom;
      compatibilityScore += (receiveRatio - 0.32) * 0.07;

      const tierDiff = Math.abs(Sa - Sb) / 100;
      compatibilityScore += (1 - tierDiff) * 0.055;

      if (Sb > Sa + 12 && !likedMeIds.has(u.id)) {
        const excess = Math.min(1, (Sb - Sa - 12) / 28);
        compatibilityScore *= 1 - 0.1 * excess;
      }

      compatibilityScore = Math.min(1, Math.max(0, compatibilityScore));

      const photoUrl = u.media[0]?.url;
      const galleryPhotos = u.media.map((m) => m.url).filter(Boolean) as string[];
      const tags = u.interests.map((i) => i.interest.label);
      const isVerified = u.emailVerified || u.verificationRecords.length > 0;
      const commonInterests = u.interests
        .filter((i) => actorInterestIds.has(i.interestId))
        .map((i) => i.interest.label);
      const onlineMs = 5 * 60 * 1000;
      const isOnline =
        u.lastSeenAt != null && Date.now() - u.lastSeenAt.getTime() < onlineMs;
      const isNewMember = Date.now() - u.createdAt.getTime() < 48 * 60 * 60 * 1000;

      scored.push({
        userId: u.id,
        fullName: u.profile.fullName,
        age: candAge,
        gender: u.profile.gender,
        city: u.profile.city,
        country: u.profile.country,
        compatibilityScore,
        distanceKm,
        bio: u.profile.bio ?? undefined,
        photoUrl: photoUrl ?? undefined,
        galleryPhotos: galleryPhotos.length ? galleryPhotos : undefined,
        tags: tags.length ? tags : undefined,
        commonInterests: commonInterests.length ? commonInterests : undefined,
        isVerified,
        isOnline,
        isNewMember
      });
    }

    const boosted = await applyPineconeBoost(
      userId,
      scored.map((s) => ({ userId: s.userId, compatibilityScore: s.compatibilityScore }))
    );
    const boostMap = new Map(boosted.map((b) => [b.userId, b.compatibilityScore]));
    for (const row of scored) {
      const b = boostMap.get(row.userId);
      if (b != null) row.compatibilityScore = b;
    }

    scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    return scored.slice(0, 50);
  }

  async swipe(input: SwipeInput) {
    if (input.action === "superlike") {
      const limit = Number(process.env.SUPERLIKES_PER_DAY ?? 5);
      const start = MatchingService.startOfUtcDay();
      const used = await prisma.swipe.count({
        where: {
          actorUserId: input.actorUserId,
          action: "SUPERLIKE",
          createdAt: { gte: start }
        }
      });
      if (used >= limit) {
        throw new AppError(
          "TOO_MANY_REQUESTS",
          `Superlike limit reached (${limit} per day).`,
          429
        );
      }
    }

    const actionMap: Record<SwipeInput["action"], SwipeAction> = {
      like: "LIKE",
      pass: "PASS",
      superlike: "SUPERLIKE"
    };

    const swipeRow = await prisma.swipe.upsert({
      where: {
        actorUserId_targetUserId: {
          actorUserId: input.actorUserId,
          targetUserId: input.targetUserId
        }
      },
      create: {
        actorUserId: input.actorUserId,
        targetUserId: input.targetUserId,
        action: actionMap[input.action]
      },
      update: {
        action: actionMap[input.action]
      }
    });

    const reverseSwipe = await prisma.swipe.findUnique({
      where: {
        actorUserId_targetUserId: {
          actorUserId: input.targetUserId,
          targetUserId: input.actorUserId
        }
      }
    });

    const actorPositive = input.action === "like" || input.action === "superlike";
    const reversePositive = isPositiveAction(reverseSwipe?.action);
    const isMatch = actorPositive && reversePositive;

    if (isMatch) {
      const ordered = [input.actorUserId, input.targetUserId].sort();
      const prior = await prisma.match.findUnique({
        where: { userAId_userBId: { userAId: ordered[0], userBId: ordered[1] } }
      });
      const matchRow = await prisma.match.upsert({
        where: { userAId_userBId: { userAId: ordered[0], userBId: ordered[1] } },
        create: { userAId: ordered[0], userBId: ordered[1] },
        update: { isActive: true }
      });
      if (!prior || !prior.isActive) {
        await notificationService.notifyNewMatch(
          matchRow.id,
          input.actorUserId,
          input.targetUserId
        );
      }
    }

    await desirabilityService.applySwipeDesirability(
      swipeRow.id,
      input.targetUserId,
      input.actorUserId,
      input.action
    );
    await desirabilityService.penalizeMassSwiper(input.actorUserId);

    return {
      actorUserId: input.actorUserId,
      targetUserId: input.targetUserId,
      action: input.action,
      isMatch
    };
  }

  async undoLastSwipe(actorUserId: string) {
    const windowMs = Number(process.env.SWIPE_UNDO_WINDOW_MS ?? 24 * 60 * 60 * 1000);
    const last = await prisma.swipe.findFirst({
      where: { actorUserId },
      orderBy: { createdAt: "desc" }
    });

    if (!last) {
      throw new AppError("NOT_FOUND", "No swipe to undo.", 404);
    }
    if (Date.now() - last.createdAt.getTime() > windowMs) {
      throw new AppError("BAD_REQUEST", "Undo window expired.", 400);
    }

    await desirabilityService.reverseSwipeDesirability(last.id);

    const targetId = last.targetUserId;
    await prisma.swipe.delete({ where: { id: last.id } });

    const ordered = [actorUserId, targetId].sort();
    const match = await prisma.match.findUnique({
      where: { userAId_userBId: { userAId: ordered[0], userBId: ordered[1] } }
    });

    let matchRemoved = false;
    if (match) {
      const forward = await prisma.swipe.findUnique({
        where: {
          actorUserId_targetUserId: {
            actorUserId,
            targetUserId: targetId
          }
        }
      });
      const backward = await prisma.swipe.findUnique({
        where: {
          actorUserId_targetUserId: {
            actorUserId: targetId,
            targetUserId: actorUserId
          }
        }
      });
      const mutual =
        isPositiveAction(forward?.action) && isPositiveAction(backward?.action);
      if (!mutual) {
        await prisma.match.delete({ where: { id: match.id } });
        matchRemoved = true;
      }
    }

    return { undone: true, matchRemoved };
  }

  async listMatchesForMobile(userId: string) {
    const rows = await prisma.match.findMany({
      where: {
        isActive: true,
        OR: [{ userAId: userId }, { userBId: userId }]
      },
      include: {
        chat: { include: { _count: { select: { messages: true } } } }
      },
      orderBy: { matchedAt: "desc" }
    });
    const otherIds = rows.map((m) => (m.userAId === userId ? m.userBId : m.userAId));
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

    return rows.map((m) => {
      const oid = m.userAId === userId ? m.userBId : m.userAId;
      const prof = pmap.get(oid);
      const photoUrl = prof?.user.media[0]?.url ?? undefined;
      const msgCount = m.chat?._count?.messages ?? 0;
      return {
        matchId: m.id,
        userId: oid,
        name: prof?.fullName ?? "Member",
        photoUrl,
        matchedAt: m.matchedAt.toISOString(),
        isNew: msgCount === 0
      };
    });
  }

  async listMatches(userId: string) {
    return prisma.match.findMany({
      where: {
        isActive: true,
        OR: [{ userAId: userId }, { userBId: userId }]
      },
      include: { chat: true },
      orderBy: { matchedAt: "desc" }
    });
  }

  async ensureActiveMatch(userAId: string, userBId: string) {
    return prisma.match.findFirst({
      where: {
        isActive: true,
        OR: [
          { userAId, userBId },
          { userAId: userBId, userBId: userAId }
        ]
      }
    });
  }

  private static startOfUtcDay() {
    const d = new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  }
}

export const matchingService = new MatchingService();
