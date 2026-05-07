import { createHash, randomBytes } from "node:crypto";

export function generateRefreshTokenRaw() {
  return randomBytes(48).toString("base64url");
}

export function hashRefreshToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}
