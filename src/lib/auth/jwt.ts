import jwt from "jsonwebtoken";

export type AccessPayload = {
  sub: string;
  email: string;
  typ: "access";
};

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.includes("replace_me")) {
    throw new Error("JWT_SECRET is not configured.");
  }
  return secret;
};

export function signAccessToken(userId: string, email: string) {
  return jwt.sign(
    { sub: userId, email, typ: "access" } satisfies AccessPayload,
    getSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
      issuer: "moidate",
      audience: "moidate-api"
    } as jwt.SignOptions
  );
}

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, getSecret(), {
    issuer: "moidate",
    audience: "moidate-api"
  }) as AccessPayload;
  if (decoded.typ !== "access") {
    throw new Error("Invalid token type");
  }
  return decoded;
}
