import { Gender, LookingFor } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { matchingVectorService } from "@/services/matching-vector.service";
import { AppError } from "@/utils/app-error";

export type UserProfile = {
  userId: string;
  fullName: string;
  age: number;
  gender: string;
  city: string;
  country: string;
  interests: string[];
  lookingFor: string[];
  bio: string;
  showProfile: boolean;
  hideExactLocation: boolean;
  distanceKm: number;
};

export class UserService {
  async getMe(userId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        interests: { include: { interest: true } }
      }
    });

    if (!user || !user.profile) {
      throw new AppError("NOT_FOUND", "User profile not found.", 404);
    }

    const now = new Date();
    const age = now.getFullYear() - user.profile.dateOfBirth.getFullYear();

    return {
      userId,
      fullName: user.profile.fullName,
      age,
      gender: user.profile.gender,
      city: user.profile.city,
      country: user.profile.country,
      interests: user.interests.map((item) => item.interest.slug),
      lookingFor: user.profile.lookingFor,
      bio: user.profile.bio ?? "",
      showProfile: user.profile.showProfile,
      hideExactLocation: user.profile.hideExactLocation,
      distanceKm: user.profile.distanceKm
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
        interests: { include: { interest: true } }
      }
    });

    if (!user?.profile || !user.profile.showProfile) {
      throw new AppError("NOT_FOUND", "User not found.", 404);
    }

    const now = new Date();
    const age = now.getFullYear() - user.profile.dateOfBirth.getFullYear();

    return {
      userId: targetUserId,
      fullName: user.profile.fullName,
      age,
      gender: user.profile.gender,
      city: user.profile.city,
      country: user.profile.country,
      interests: user.interests.map((item) => item.interest.slug),
      lookingFor: user.profile.lookingFor,
      bio: user.profile.bio ?? "",
      showProfile: user.profile.showProfile,
      hideExactLocation: user.profile.hideExactLocation,
      distanceKm: user.profile.distanceKm
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
