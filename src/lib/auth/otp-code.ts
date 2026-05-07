import { createHash, randomInt } from "node:crypto";

const pepper = () => process.env.OTP_PEPPER || process.env.JWT_SECRET || "moidate-otp-dev";

export function generateNumericOtp(length = 6) {
  const max = 10 ** length;
  const n = randomInt(0, max);
  return n.toString().padStart(length, "0");
}

export function hashOtpCode(code: string) {
  return createHash("sha256").update(`${pepper()}:${code}`).digest("hex");
}
