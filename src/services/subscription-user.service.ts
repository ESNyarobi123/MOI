import { prisma } from "@/lib/db/prisma";

/** Logged-in user: browse plans and see current subscription (Stripe checkout deferred). */
export class SubscriptionUserService {
  listPlansPublic() {
    return prisma.subscriptionPlan.findMany({
      orderBy: { code: "asc" }
    });
  }

  async getMyActiveSubscription(userId: string) {
    const now = new Date();
    return prisma.subscription.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        endsAt: { gte: now }
      },
      include: { plan: true },
      orderBy: { endsAt: "desc" }
    });
  }
}

export const subscriptionUserService = new SubscriptionUserService();
