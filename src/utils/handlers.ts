import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { ERROR_MESSAGES } from "@/constants/errors";
import { AppError } from "@/utils/app-error";
import { fail } from "@/utils/response";

function isDatabaseUnavailable(error: unknown): boolean {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P1001"
  ) {
    return true;
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  const msg = error instanceof Error ? error.message : String(error);
  return /Can't reach database server|P1001/i.test(msg);
}

export async function withErrorHandler<T>(
  request: NextRequest,
  fn: () => Promise<T>
) {
  try {
    const result = await fn();
    return result;
  } catch (error) {
    const requestId = request.headers.get("x-request-id") ?? undefined;
    if (error instanceof AppError) {
      return fail(
        {
          code: error.code,
          message: error.message,
          status: error.status,
          details: error.details
        },
        requestId
      );
    }
    if (isDatabaseUnavailable(error)) {
      return fail(
        {
          code: "SERVICE_UNAVAILABLE",
          message: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
          details:
            process.env.NODE_ENV === "development" && error instanceof Error
              ? error.message
              : undefined
        },
        requestId
      );
    }
    return fail(
      {
        code: "INTERNAL_SERVER_ERROR",
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        details: error instanceof Error ? error.message : "Unknown error"
      },
      requestId
    );
  }
}
