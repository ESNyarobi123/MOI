import { NextResponse } from "next/server";
import type { ApiErrorBody, ApiErrorCode, ApiResponse, ApiSuccess } from "@/types/api.types";

type ErrorInput = {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
  status?: number;
};

const codeToStatus: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  SERVICE_UNAVAILABLE: 503,
  INTERNAL_SERVER_ERROR: 500
};

function buildMeta(requestId?: string) {
  return {
    requestId: requestId ?? crypto.randomUUID(),
    timestamp: new Date().toISOString()
  };
}

export function ok<T>(data: T, requestId?: string, status = 200) {
  const body: ApiSuccess<T> = {
    ok: true,
    data,
    meta: buildMeta(requestId)
  };
  return NextResponse.json<ApiResponse<T>>(body, { status });
}

export function fail(input: ErrorInput, requestId?: string) {
  const body: ApiErrorBody = {
    ok: false,
    error: {
      code: input.code,
      message: input.message,
      details: input.details
    },
    meta: buildMeta(requestId)
  };

  return NextResponse.json(body, {
    status: input.status ?? codeToStatus[input.code]
  });
}
