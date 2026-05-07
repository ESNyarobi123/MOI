import { VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { notifyVendorVerificationSubmitted } from "@/lib/verification/kyc-vendor";
import { AppError } from "@/utils/app-error";

export class VerificationService {
  async submitVerification(userId: string, idDocUrl?: string, selfieUrl?: string) {
    if (!idDocUrl && !selfieUrl) {
      throw new AppError(
        "BAD_REQUEST",
        "Provide at least idDocUrl or selfieUrl for verification.",
        400
      );
    }

    const record = await prisma.verificationRecord.create({
      data: {
        userId,
        idDocUrl,
        selfieUrl,
        status: "PENDING"
      }
    });

    void notifyVendorVerificationSubmitted({
      userId,
      recordId: record.id,
      idDocUrl,
      selfieUrl
    });

    return record;
  }

  async status(userId: string) {
    return prisma.verificationRecord.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  async listPendingForAdmin(limit = 100) {
    return prisma.verificationRecord.findMany({
      where: { status: "PENDING" },
      include: {
        user: { include: { profile: true } }
      },
      orderBy: { createdAt: "asc" },
      take: limit
    });
  }

  async approve(recordId: string, reviewerUserId: string, notes?: string) {
    const record = await prisma.verificationRecord.findUnique({
      where: { id: recordId }
    });
    if (!record) {
      throw new AppError("NOT_FOUND", "Verification record not found.", 404);
    }
    if (record.status !== "PENDING") {
      throw new AppError("CONFLICT", "This request was already reviewed.", 409);
    }

    return prisma.verificationRecord.update({
      where: { id: recordId },
      data: {
        status: VerificationStatus.APPROVED,
        reviewedBy: reviewerUserId,
        reviewedAt: new Date(),
        notes: notes ?? null
      }
    });
  }

  async reject(recordId: string, reviewerUserId: string, notes?: string) {
    const record = await prisma.verificationRecord.findUnique({
      where: { id: recordId }
    });
    if (!record) {
      throw new AppError("NOT_FOUND", "Verification record not found.", 404);
    }
    if (record.status !== "PENDING") {
      throw new AppError("CONFLICT", "This request was already reviewed.", 409);
    }

    return prisma.verificationRecord.update({
      where: { id: recordId },
      data: {
        status: VerificationStatus.REJECTED,
        reviewedBy: reviewerUserId,
        reviewedAt: new Date(),
        notes: notes ?? null
      }
    });
  }
}

export const verificationService = new VerificationService();
