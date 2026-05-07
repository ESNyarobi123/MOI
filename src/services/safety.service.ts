import { ReportTargetType } from "@prisma/client";
import { sendSmsTwilio } from "@/lib/notifications/twilio-sms";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/utils/app-error";

export class SafetyService {
  async blockUser(blockerUserId: string, blockedUserId: string, reason?: string) {
    return prisma.userBlock.upsert({
      where: {
        blockerUserId_blockedUserId: { blockerUserId, blockedUserId }
      },
      create: { blockerUserId, blockedUserId, reason },
      update: { reason }
    });
  }

  async reportUser(
    reporterUserId: string,
    targetId: string,
    reason: string,
    details?: string
  ) {
    return prisma.report.create({
      data: {
        reporterUserId,
        targetType: ReportTargetType.USER,
        targetId,
        reason,
        details
      }
    });
  }

  async reportMessage(
    reporterUserId: string,
    messageId: string,
    reason: string,
    details?: string
  ) {
    return prisma.report.create({
      data: {
        reporterUserId,
        targetType: ReportTargetType.MESSAGE,
        targetId: messageId,
        reason,
        details
      }
    });
  }

  async createEmergencyPlan(input: {
    userId: string;
    contactPhone: string;
    dateLocation: string;
    startTime: string;
    endTime?: string;
    isShared?: boolean;
  }) {
    return prisma.emergencyPlan.create({
      data: {
        userId: input.userId,
        contactPhone: input.contactPhone,
        dateLocation: input.dateLocation,
        startTime: new Date(input.startTime),
        endTime: input.endTime ? new Date(input.endTime) : null,
        isShared: input.isShared ?? false
      }
    });
  }

  async listEmergencyPlans(userId: string) {
    return prisma.emergencyPlan.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  async shareEmergencyPlanBySms(planId: string, userId: string) {
    const plan = await prisma.emergencyPlan.findFirst({
      where: { id: planId, userId }
    });
    if (!plan) {
      throw new AppError("NOT_FOUND", "Emergency plan not found.", 404);
    }

    const endHint =
      plan.endTime ??
      new Date(plan.startTime.getTime() + 4 * 60 * 60 * 1000);

    const body = [
      "MoiDate — date safety check-in.",
      `Where: ${plan.dateLocation}`,
      `Starts: ${plan.startTime.toISOString()}`,
      `Expected by: ${endHint.toISOString()}`,
      "If you do not hear from me after this window, please follow our agreed safety steps."
    ].join(" ");

    const sms = await sendSmsTwilio(plan.contactPhone, body);

    await prisma.emergencyPlan.update({
      where: { id: planId },
      data: { isShared: true }
    });

    return { sms, planId };
  }
}

export const safetyService = new SafetyService();
