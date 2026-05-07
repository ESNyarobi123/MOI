import { Gender } from "@prisma/client";
import { signAccessToken } from "@/lib/auth/jwt";
import { generateNumericOtp, hashOtpCode } from "@/lib/auth/otp-code";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateRefreshTokenRaw, hashRefreshToken } from "@/lib/auth/refresh-token";
import { prisma } from "@/lib/db/prisma";
import { sendRegistrationOtp } from "@/lib/notifications/email-otp";
import { AppError } from "@/utils/app-error";

const OTP_PURPOSE_REGISTER = "REGISTER_VERIFY";
const OTP_EXPIRES_MIN = 15;

export type RegisterInput = {
  email: string;
  password: string;
  phone?: string;
  fullName: string;
  age: number;
  gender: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export class AuthService {
  async register(input: RegisterInput) {
    const email = normalizeEmail(input.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new AppError("BAD_REQUEST", "Invalid email address.", 400);
    }
    if (input.password.length < 8) {
      throw new AppError("BAD_REQUEST", "Password must be at least 8 characters.", 400);
    }

    const normalizedGender = this.normalizeGender(input.gender);
    const now = new Date();
    const dateOfBirth = new Date(
      now.getFullYear() - input.age,
      now.getMonth(),
      now.getDate()
    );

    const passwordHash = await hashPassword(input.password);

    let user;
    try {
      user = await prisma.user.create({
        data: {
          email,
          phone: input.phone ?? null,
          passwordHash,
          emailVerified: false,
          isAgeVerified: input.age >= 18,
          ageVerifiedAt: input.age >= 18 ? new Date() : null,
          profile: {
            create: {
              fullName: input.fullName,
              dateOfBirth,
              gender: normalizedGender,
              city: "Unknown",
              country: "Unknown",
              lookingFor: ["DATING"]
            }
          }
        }
      });
    } catch (e: unknown) {
      if (
        e &&
        typeof e === "object" &&
        "code" in e &&
        (e as { code: string }).code === "P2002"
      ) {
        throw new AppError(
          "CONFLICT",
          "An account with this email (or phone) already exists.",
          409
        );
      }
      throw e;
    }

    await this.createAndSendRegisterOtp(email);

    return {
      userId: user.id,
      email,
      message: "Verification code sent to your email.",
      expiresInMinutes: OTP_EXPIRES_MIN
    };
  }

  async verifyRegistrationOtp(email: string, code: string) {
    const normalized = normalizeEmail(email);
    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      throw new AppError("BAD_REQUEST", "Code must be 6 digits.", 400);
    }

    const hash = hashOtpCode(trimmed);
    const challenge = await prisma.otpChallenge.findFirst({
      where: {
        email: normalized,
        purpose: OTP_PURPOSE_REGISTER,
        consumedAt: null,
        expiresAt: { gt: new Date() },
        codeHash: hash
      },
      orderBy: { createdAt: "desc" }
    });

    if (!challenge) {
      throw new AppError("BAD_REQUEST", "Invalid or expired verification code.", 400);
    }

    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() }
    });

    const user = await prisma.user.findUnique({ where: { email: normalized } });
    if (!user?.email) {
      throw new AppError("NOT_FOUND", "Account not found.", 404);
    }

    const alreadyVerified = user.emailVerified;
    if (!alreadyVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true }
      });
    }

    const tokens = await this.issueTokenPair(user.id, user.email);
    return { alreadyVerified, ...tokens };
  }

  async resendRegistrationOtp(email: string) {
    const normalized = normalizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: normalized } });
    if (!user) {
      throw new AppError("NOT_FOUND", "Account not found.", 404);
    }
    if (user.emailVerified) {
      throw new AppError("BAD_REQUEST", "Email is already verified.", 400);
    }
    await this.createAndSendRegisterOtp(normalized);
    return { message: "New code sent.", expiresInMinutes: OTP_EXPIRES_MIN };
  }

  async login(input: LoginInput) {
    const email = normalizeEmail(input.email);
    if (!input.password) {
      throw new AppError("BAD_REQUEST", "Password is required.", 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash || !user.email) {
      throw new AppError("UNAUTHORIZED", "Invalid email or password.", 401);
    }
    if (user.isBanned) {
      throw new AppError("FORBIDDEN", "Account permanently banned.", 403);
    }
    if (!user.isActive) {
      throw new AppError("FORBIDDEN", "Account disabled.", 403);
    }
    if (user.isSuspended) {
      throw new AppError("FORBIDDEN", "Account suspended.", 403);
    }

    const passwordOk = await verifyPassword(input.password, user.passwordHash);
    if (!passwordOk) {
      throw new AppError("UNAUTHORIZED", "Invalid email or password.", 401);
    }

    if (!user.emailVerified) {
      throw new AppError(
        "FORBIDDEN",
        "Please verify your email with the code we sent.",
        403,
        { reason: "EMAIL_NOT_VERIFIED" }
      );
    }

    return this.issueTokenPair(user.id, user.email);
  }

  async refresh(refreshTokenRaw: string) {
    const hash = hashRefreshToken(refreshTokenRaw);
    const row = await prisma.refreshToken.findUnique({
      where: { tokenHash: hash },
      include: { user: true }
    });
    if (!row || row.expiresAt < new Date()) {
      throw new AppError("UNAUTHORIZED", "Invalid or expired refresh token.", 401);
    }
    if (
      !row.user.email ||
      row.user.isSuspended ||
      row.user.isBanned ||
      !row.user.isActive
    ) {
      throw new AppError("UNAUTHORIZED", "Invalid refresh token.", 401);
    }

    await prisma.refreshToken.delete({ where: { id: row.id } });
    return this.issueTokenPair(row.userId, row.user.email);
  }

  async logout(refreshTokenRaw: string) {
    const hash = hashRefreshToken(refreshTokenRaw);
    await prisma.refreshToken.deleteMany({ where: { tokenHash: hash } });
    return { loggedOut: true };
  }

  async verifyAge(userId: string, age: number) {
    const isAllowed = age >= 18;
    await prisma.user.update({
      where: { id: userId },
      data: {
        isAgeVerified: isAllowed,
        ageVerifiedAt: isAllowed ? new Date() : null
      }
    });

    return {
      userId,
      isAllowed
    };
  }

  private async createAndSendRegisterOtp(email: string) {
    await prisma.otpChallenge.updateMany({
      where: { email, purpose: OTP_PURPOSE_REGISTER, consumedAt: null },
      data: { consumedAt: new Date() }
    });

    const code = generateNumericOtp(6);
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_MIN * 60 * 1000);
    await prisma.otpChallenge.create({
      data: {
        email,
        codeHash: hashOtpCode(code),
        purpose: OTP_PURPOSE_REGISTER,
        expiresAt
      }
    });
    await sendRegistrationOtp(email, code);
  }

  private async issueTokenPair(userId: string, email: string) {
    const accessToken = signAccessToken(userId, email);
    const refreshRaw = generateRefreshTokenRaw();
    const tokenHash = hashRefreshToken(refreshRaw);
    const refreshDays = Number(process.env.JWT_REFRESH_EXPIRES_DAYS ?? 30);
    const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt
      }
    });

    return {
      accessToken,
      refreshToken: refreshRaw,
      tokenType: "Bearer" as const,
      expiresIn: process.env.JWT_EXPIRES_IN ?? "15m"
    };
  }

  private normalizeGender(gender: string): Gender {
    const value = gender.toLowerCase();
    if (value === "male") return "MALE";
    if (value === "female") return "FEMALE";
    if (value === "non_binary" || value === "non-binary") return "NON_BINARY";
    return "OTHER";
  }
}

export const authService = new AuthService();
