import type { User, UserMedia } from "@prisma/client";
import { Gender, LookingFor } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { matchingVectorService } from "@/services/matching-vector.service";
import { subscriptionUserService } from "@/services/subscription-user.service";
import { AppError } from "@/utils/app-error";

export type UserProfile = {
  userId: string;
  fullName: string;
  /** Display name for mobile / web clients */
  name?: string;
  email?: string;
  age: number;
  gender: string;
  city: string;
  country: string;
  /** e.g. "Nairobi, Kenya" */
  locationLabel?: string;
  interests: string[];
  lookingFor: string[];
  bio: string;
  showProfile: boolean;
  hideExactLocation: boolean;
  distanceKm: number;
  photoUrl?: string | null;
  galleryPhotos?: string[];
  isVerified?: boolean;
  subscriptionPlan?: string;
  stats?: { matches: number; likes: number; chats: number };
  /** 0–100, for “profile strength” UI */
  profileCompletion?: number;
  /** Trust / age gate — required before user appears in others’ discover feed */
  isAgeVerified?: boolean;
  /** True until age gate completed (OAuth users start here) */
  needsOnboarding?: boolean;
};

export class UserService {
  /**
   * Users who signed up with email/password already declared age at registration; older DB rows may
   * still have isAgeVerified=false from schema defaults. One-time sync so they skip OAuth onboarding
   * and appear in discover for others.
   */
  async ensureLegacyAgeBackfillByUserId(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });
    if (user?.profile) {
      await this.backfillLegacyAgeVerification(user);
    }
  }

  private ageYearsFromDob(dob: Date): number {
    const now = new Date();
    return now.getFullYear() - dob.getFullYear();
  }

  private async backfillLegacyAgeVerification(
    user: Pick<User, "id" | "isAgeVerified" | "ageVerifiedAt" | "passwordHash" | "emailVerified"> & {
      profile: { dateOfBirth: Date } | null;
    }
  ): Promise<boolean> {
    if (!user.profile) return false;
    if (user.isAgeVerified || user.ageVerifiedAt) return false;
    if (!user.passwordHash || !user.emailVerified) return false;
    if (this.ageYearsFromDob(user.profile.dateOfBirth) < 18) return false;
    await prisma.user.update({
      where: { id: user.id },
      data: { isAgeVerified: true, ageVerifiedAt: new Date() }
    });
    return true;
  }

  private mediaUrls(media: UserMedia[]): { photoUrl?: string; galleryPhotos: string[] } {
    const galleryPhotos = media.map((m) => m.url);
    const primary = media.find((m) => m.isPrimary);
    const photoUrl = primary?.url ?? media[0]?.url;
    return { photoUrl, galleryPhotos };
  }

  private computeProfileCompletion(input: {
    hasPhoto: boolean;
    bioLength: number;
    interestsCount: number;
    galleryCount: number;
    hasLocation: boolean;
    lookingForCount: number;
    isVerified: boolean;
  }): number {
    let score = 0;
    if (input.hasPhoto) score += 25;
    if (input.bioLength >= 20) score += 20;
    else if (input.bioLength >= 8) score += 10;
    if (input.interestsCount >= 3) score += 15;
    else if (input.interestsCount >= 1) score += 8;
    if (input.galleryCount >= 3) score += 15;
    else if (input.galleryCount >= 2) score += 10;
    else if (input.galleryCount >= 1) score += 5;
    if (input.hasLocation) score += 10;
    if (input.lookingForCount > 0) score += 10;
    if (input.isVerified) score += 5;
    return Math.min(100, score);
  }

  async getMe(userId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        interests: { include: { interest: true } },
        media: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] }
      }
    });

    if (!user || !user.profile) {
      throw new AppError("NOT_FOUND", "User profile not found.", 404);
    }

    const backfilled = await this.backfillLegacyAgeVerification(user);
    if (backfilled) {
      user.isAgeVerified = true;
    }

    const [matchCount, likeCount, chatCount, sub, approvedVerification] = await Promise.all([
      prisma.match.count({
        where: { isActive: true, OR: [{ userAId: userId }, { userBId: userId }] }
      }),
      prisma.swipe.count({
        where: {
          targetUserId: userId,
          action: { in: ["LIKE", "SUPERLIKE"] }
        }
      }),
      prisma.chatParticipant.count({ where: { userId } }),
      subscriptionUserService.getMyActiveSubscription(userId),
      prisma.verificationRecord.findFirst({
        where: { userId, status: "APPROVED" }
      })
    ]);

    const now = new Date();
    const age = now.getFullYear() - user.profile.dateOfBirth.getFullYear();
    const bio = user.profile.bio ?? "";
    const interests = user.interests.map((item) => item.interest.slug);
    const { photoUrl, galleryPhotos } = this.mediaUrls(user.media);
    const isVerified = !!approvedVerification || user.emailVerified;
    const locationLabel = [user.profile.city, user.profile.country].filter(Boolean).join(", ");

    const profileCompletion = this.computeProfileCompletion({
      hasPhoto: !!photoUrl,
      bioLength: bio.length,
      interestsCount: interests.length,
      galleryCount: galleryPhotos.length,
      hasLocation:
        !!(user.profile.city && user.profile.country) &&
        user.profile.city !== "Unknown" &&
        user.profile.country !== "Unknown",
      lookingForCount: user.profile.lookingFor.length,
      isVerified
    });

    return {
      userId,
      fullName: user.profile.fullName,
      name: user.profile.fullName,
      email: user.email ?? undefined,
      age,
      gender: user.profile.gender,
      city: user.profile.city,
      country: user.profile.country,
      locationLabel,
      interests,
      lookingFor: user.profile.lookingFor,
      bio,
      showProfile: user.profile.showProfile,
      hideExactLocation: user.profile.hideExactLocation,
      distanceKm: user.profile.distanceKm,
      photoUrl,
      galleryPhotos,
      isVerified,
      subscriptionPlan: sub?.plan.code ?? "FREE",
      stats: {
        matches: matchCount,
        likes: likeCount,
        chats: chatCount
      },
      profileCompletion,
      isAgeVerified: user.isAgeVerified,
      needsOnboarding: !user.isAgeVerified
    };
  }

  /**
   * Profile visible to another user: active match, not blocked, showProfile on.
   * Never includes email/phone (those live on User, not returned here).
   */
  async getPublicProfile(viewerId: string, targetUserId: string): Promise<UserProfile> {
    if (viewerId === targetUserId) {
      return this.getMe(viewerId);
    }

    const blocked = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerUserId: viewerId, blockedUserId: targetUserId },
          { blockerUserId: targetUserId, blockedUserId: viewerId }
        ]
      }
    });
    if (blocked) {
      throw new AppError("NOT_FOUND", "User not found.", 404);
    }

    const activeMatch = await prisma.match.findFirst({
      where: {
        isActive: true,
        OR: [
          { userAId: viewerId, userBId: targetUserId },
          { userAId: targetUserId, userBId: viewerId }
        ]
      }
    });
    if (!activeMatch) {
      throw new AppError("NOT_FOUND", "User not found.", 404);
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        profile: true,
        interests: { include: { interest: true } },
        media: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] }
      }
    });

    if (!user?.profile || !user.profile.showProfile) {
      throw new AppError("NOT_FOUND", "User not found.", 404);
    }

    const approvedVerification = await prisma.verificationRecord.findFirst({
      where: { userId: targetUserId, status: "APPROVED" }
    });

    const now = new Date();
    const age = now.getFullYear() - user.profile.dateOfBirth.getFullYear();
    const { photoUrl, galleryPhotos } = this.mediaUrls(user.media);
    const locationLabel = [user.profile.city, user.profile.country].filter(Boolean).join(", ");

    return {
      userId: targetUserId,
      fullName: user.profile.fullName,
      name: user.profile.fullName,
      age,
      gender: user.profile.gender,
      city: user.profile.city,
      country: user.profile.country,
      locationLabel,
      interests: user.interests.map((item) => item.interest.slug),
      lookingFor: user.profile.lookingFor,
      bio: user.profile.bio ?? "",
      showProfile: user.profile.showProfile,
      hideExactLocation: user.profile.hideExactLocation,
      distanceKm: user.profile.distanceKm,
      photoUrl,
      galleryPhotos,
      isVerified: !!approvedVerification || user.emailVerified
    };
  }

  async updateMe(
    userId: string,
    input: Partial<{
      fullName: string;
      bio: string;
      city: string;
      country: string;
      gender: string;
      lookingFor: string[];
    }>
  ) {
    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new AppError("NOT_FOUND", "User profile not found.", 404);
    }

    const updated = await prisma.userProfile.update({
      where: { userId },
      data: {
        fullName: input.fullName ?? undefined,
        bio: input.bio ?? undefined,
        city: input.city ?? undefined,
        country: input.country ?? undefined,
        gender: input.gender ? this.normalizeGender(input.gender) : undefined,
        lookingFor: input.lookingFor
          ? input.lookingFor.map((item) => this.normalizeLookingFor(item))
          : undefined
      }
    });
    matchingVectorService.scheduleSync(userId);
    return updated;
  }

  async updateInterests(userId: string, interests: string[]) {
    await prisma.userInterest.deleteMany({ where: { userId } });

    for (const slug of interests) {
      const interest = await prisma.interest.upsert({
        where: { slug },
        create: { slug, label: slug },
        update: {}
      });
      await prisma.userInterest.create({
        data: { userId, interestId: interest.id }
      });
    }

    matchingVectorService.scheduleSync(userId);
    return this.getMe(userId);
  }

  async updatePrivacy(
    userId: string,
    input: Partial<{ hideExactLocation: boolean; showProfile: boolean; distanceKm: number }>
  ) {
    return prisma.userProfile.update({
      where: { userId },
      data: {
        hideExactLocation: input.hideExactLocation ?? undefined,
        showProfile: input.showProfile ?? undefined,
        distanceKm: input.distanceKm ?? undefined
      }
    });
  }

  async listBlockedUsers(userId: string) {
    return prisma.userBlock.findMany({
      where: { blockerUserId: userId },
      include: { blocked: { include: { profile: true } } }
    });
  }

  async setOnlineStatus(userId: string, online: boolean) {
    return prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: online ? new Date() : new Date() },
      select: { id: true, lastSeenAt: true, isActive: true }
    });
  }

  private normalizeGender(gender: string): Gender {
    const value = gender.toLowerCase();
    if (value === "male") return "MALE";
    if (value === "female") return "FEMALE";
    if (value === "non_binary" || value === "non-binary") return "NON_BINARY";
    return "OTHER";
  }

  private normalizeLookingFor(value: string): LookingFor {
    const mapped = value.toUpperCase().replace(/-/g, "_");
    if (mapped === "FRIENDSHIP") return "FRIENDSHIP";
    if (mapped === "MARRIAGE") return "MARRIAGE";
    if (mapped === "SERIOUS_RELATIONSHIP") return "SERIOUS_RELATIONSHIP";
    return "DATING";
  }
}

export const userService = new UserService();
