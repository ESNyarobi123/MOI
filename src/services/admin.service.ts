import { Prisma, ReportStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/utils/app-error";

const userListSelect = {
  id: true,
  email: true,
  phone: true,
  emailVerified: true,
  isAgeVerified: true,
  role: true,
  isActive: true,
  isSuspended: true,
  isBanned: true,
  bannedAt: true,
  bannedReason: true,
  fakeAccountFlag: true,
  accountRiskNote: true,
  lastSeenAt: true,
  createdAt: true,
  updatedAt: true,
  profile: true
} as const;

export class AdminService {
  async listUsers(limit = 50) {
    return prisma.user.findMany({
      select: userListSelect,
      orderBy: { createdAt: "desc" },
      take: limit
    });
  }

  async suspendUser(userId: string, suspend: boolean) {
    const u = await prisma.user.findUnique({ where: { id: userId } });
    if (u?.isBanned) {
      throw new AppError("CONFLICT", "Unban the account before changing suspension.", 409);
    }
    return prisma.user.update({
      where: { id: userId },
      data: { isSuspended: suspend },
      select: userListSelect
    });
  }

  async banUser(userId: string, ban: boolean, reason?: string) {
    if (ban) {
      await prisma.refreshToken.deleteMany({ where: { userId } });
      return prisma.user.update({
        where: { id: userId },
        data: {
          isBanned: true,
          isActive: false,
          isSuspended: true,
          bannedAt: new Date(),
          bannedReason: reason?.trim() || "Policy violation"
        },
        select: userListSelect
      });
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        isActive: true,
        isSuspended: false,
        bannedAt: null,
        bannedReason: null
      },
      select: userListSelect
    });
  }

  async setUserTrustFlags(
    userId: string,
    patch: { accountRiskNote?: string | null; fakeAccountFlag?: boolean }
  ) {
    const data: Prisma.UserUpdateInput = {};
    if ("accountRiskNote" in patch) {
      data.accountRiskNote = patch.accountRiskNote ?? null;
    }
    if ("fakeAccountFlag" in patch) {
      data.fakeAccountFlag = patch.fakeAccountFlag;
    }

    if (Object.keys(data).length === 0) {
      return prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: userListSelect
      });
    }

    return prisma.user.update({
      where: { id: userId },
      data,
      select: userListSelect
    });
  }

  async listReports(limit = 100) {
    return prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: limit
    });
  }

  async updateReportStatus(reportId: string, status: ReportStatus, reviewedByUserId: string) {
    return prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        reviewedBy: reviewedByUserId,
        reviewedAt: new Date()
      }
    });
  }

  /** Aggregate metrics only — no message bodies or user PII beyond counts. */
  async getPlatformOverview() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      verifiedEmailUsers,
      activeMatches,
      totalChats,
      messagesLast24h,
      openReports,
      pendingVerifications,
      distinctChatsWithMessages24h
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { emailVerified: true } }),
      prisma.match.count({ where: { isActive: true } }),
      prisma.chat.count(),
      prisma.message.count({ where: { createdAt: { gte: since } } }),
      prisma.report.count({ where: { status: "OPEN" } }),
      prisma.verificationRecord.count({ where: { status: "PENDING" } }),
      prisma.message
        .findMany({
          where: { createdAt: { gte: since } },
          distinct: ["chatId"],
          select: { chatId: true }
        })
        .then((rows) => rows.length)
    ]);

    return {
      totalUsers,
      verifiedEmailUsers,
      activeMatches,
      totalChats,
      messagesLast24h,
      distinctChatsWithMessagesLast24h: distinctChatsWithMessages24h,
      openReports,
      pendingVerifications,
      generatedAt: new Date().toISOString()
    };
  }

  async listSubscriptionPlans() {
    return prisma.subscriptionPlan.findMany({
      orderBy: { code: "asc" },
      include: {
        _count: { select: { subscriptions: true } }
      }
    });
  }

  async listAnnouncements(limit = 50) {
    return prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        creator: {
          select: { id: true, email: true, role: true }
        }
      }
    });
  }

  async createAnnouncement(createdByUserId: string, title: string, body: string) {
    return prisma.announcement.create({
      data: { title: title.trim(), body: body.trim(), createdBy: createdByUserId },
      include: {
        creator: {
          select: { id: true, email: true, role: true }
        }
      }
    });
  }

  /** Overview metrics plus rollups (no PII, no message bodies). */
  async getExtendedAnalytics() {
    const overview = await this.getPlatformOverview();
    const day24 = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const day7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [activeUsers24h, newUsers7d, totalMessages, totalSwipes] = await Promise.all([
      prisma.user.count({ where: { lastSeenAt: { gte: day24 } } }),
      prisma.user.count({ where: { createdAt: { gte: day7 } } }),
      prisma.message.count(),
      prisma.swipe.count()
    ]);

    return {
      ...overview,
      activeUsers24h,
      newUsers7d,
      totalMessages,
      totalSwipes
    };
  }

  /** Matches / chats — aggregates only (privacy-safe). */
  async getEngagementSummary() {
    const [totalMatches, activeMatches, inactiveMatches, totalChats, totalMessages, participants] =
      await Promise.all([
        prisma.match.count(),
        prisma.match.count({ where: { isActive: true } }),
        prisma.match.count({ where: { isActive: false } }),
        prisma.chat.count(),
        prisma.message.count(),
        prisma.chatParticipant.count()
      ]);

    const avgMessagesPerChat =
      totalChats > 0 ? Math.round((totalMessages / totalChats) * 100) / 100 : 0;

    return {
      totalMatches,
      activeMatches,
      inactiveMatches,
      totalChats,
      totalMessages,
      totalChatParticipantRows: participants,
      avgMessagesPerChat
    };
  }

  async listSubscriptions(limit = 100) {
    return prisma.subscription.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        plan: {
          select: { code: true, name: true, amount: true, currency: true, interval: true }
        },
        user: { select: { id: true, email: true } }
      }
    });
  }

  /** Recorded subscriptions in DB; Stripe webhook still deferred. */
  async getPaymentsSummary() {
    const [recordedSubscriptions, activeSubscriptions] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: "ACTIVE" } })
    ]);

    return {
      stripeWebhookEnabled: false,
      recordedSubscriptions,
      activeSubscriptions,
      note: "Billing webhooks and checkout are not wired yet; rows are manual or future imports."
    };
  }

  async listStickerPacksAdmin() {
    return prisma.stickerPack.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { stickers: true } } }
    });
  }

  async updateStickerPack(packId: string, patch: { isActive?: boolean; name?: string }) {
    return prisma.stickerPack.update({
      where: { id: packId },
      data: {
        ...(patch.isActive !== undefined && { isActive: patch.isActive }),
        ...(patch.name !== undefined && { name: patch.name.trim() })
      }
    });
  }
}

export const adminService = new AdminService();
