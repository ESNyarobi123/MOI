import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { NextRequest } from "next/server";
import { ERROR_MESSAGES } from "@/constants/errors";
import { requireAuth } from "@/middleware/auth.middleware";
import { statusService } from "@/services/status.service";
import { withErrorHandler } from "@/utils/handlers";
import { fail, ok } from "@/utils/response";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIMES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

function parseBase64Image(input: string): { buffer: Buffer; ext: string } | null {
  let raw = input.trim();
  let mime = "image/jpeg";
  if (raw.startsWith("data:")) {
    const match = /^data:([^;]+);base64,(.*)$/s.exec(raw);
    if (!match) return null;
    mime = match[1].toLowerCase();
    raw = match[2];
  }
  if (!ALLOWED_MIMES.has(mime)) return null;
  let buffer: Buffer;
  try {
    buffer = Buffer.from(raw, "base64");
  } catch {
    return null;
  }
  if (buffer.length === 0 || buffer.length > MAX_BYTES) return null;
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  return { buffer, ext };
}

function mediaPublicOrigin(request: NextRequest): string {
  const explicit =
    process.env.PUBLIC_MEDIA_URL?.trim()?.replace(/\/+$/, "") ||
    process.env.PUBLIC_APP_URL?.trim()?.replace(/\/+$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/+$/, "");
  if (explicit) return explicit;

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
  if (host) return `${proto}://${host}`;
  return "";
}

export async function POST(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;

    const body = await request.json().catch(() => ({}));
    const imageBase64 =
      typeof body?.imageBase64 === "string"
        ? body.imageBase64
        : typeof body?.dataUrl === "string"
          ? body.dataUrl
          : null;
    const caption = typeof body?.caption === "string" ? body.caption.slice(0, 280) : undefined;

    if (!imageBase64) {
      return fail({ code: "BAD_REQUEST", message: ERROR_MESSAGES.BAD_REQUEST }, requestId);
    }

    const parsed = parseBase64Image(imageBase64);
    if (!parsed) {
      return fail(
        { code: "BAD_REQUEST", message: "Invalid or too large image (max 5MB, JPEG/PNG/WebP)." },
        requestId
      );
    }

    const origin = mediaPublicOrigin(request);
    if (!origin) {
      return fail(
        { code: "SERVICE_UNAVAILABLE", message: "Server public URL is not configured." },
        requestId
      );
    }

    const statusDir = path.join(process.cwd(), "public", "uploads", "status", auth.userId);
    await mkdir(statusDir, { recursive: true });
    const filename = `${randomBytes(12).toString("hex")}.${parsed.ext}`;
    const filePath = path.join(statusDir, filename);
    await writeFile(filePath, parsed.buffer);

    const publicPath = `/api/v1/uploads/status/${auth.userId}/${filename}`;
    const imageUrl = `${origin}${publicPath}`;

    const status = await statusService.create({
      userId: auth.userId,
      imageUrl,
      caption,
    });

    return ok({ status, imageUrl }, requestId, 201);
  });
}
