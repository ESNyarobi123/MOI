import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { ERROR_MESSAGES } from "@/constants/errors";
import { fail } from "@/utils/response";

export type AuthContext = {
  userId: string;
  token: string;
};

export function requireAuth(request: NextRequest): AuthContext | Response {
  const header = request.headers.get("authorization");
  const requestId = request.headers.get("x-request-id") ?? undefined;

  if (!header || !header.startsWith("Bearer ")) {
    return fail(
      {
        code: "UNAUTHORIZED",
        message: ERROR_MESSAGES.UNAUTHORIZED
      },
      requestId
    );
  }

  const token = header.replace("Bearer ", "").trim();
  if (!token) {
    return fail(
      {
        code: "UNAUTHORIZED",
        message: ERROR_MESSAGES.UNAUTHORIZED
      },
      requestId
    );
  }

  try {
    const payload = verifyAccessToken(token);
    return { userId: payload.sub, token };
  } catch {
    return fail(
      {
        code: "UNAUTHORIZED",
        message: ERROR_MESSAGES.UNAUTHORIZED
      },
      requestId
    );
  }
}
