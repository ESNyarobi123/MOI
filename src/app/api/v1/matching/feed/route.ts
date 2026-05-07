import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth.middleware";
import { matchingService } from "@/services/matching.service";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";

function clampInt(v: string | null, min: number, max: number): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(max, Math.max(min, n));
}

export async function GET(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    const requestId = request.headers.get("x-request-id") ?? undefined;
    const { searchParams } = new URL(request.url);
    const countrywide = searchParams.get("countrywide") === "true";
    const radiusKm = clampInt(searchParams.get("radiusKm"), 2, 200);
    const minAge = clampInt(searchParams.get("minAge"), 18, 99);
    const maxAge = clampInt(searchParams.get("maxAge"), 18, 99);
    const preferGenderRaw = searchParams.get("preferGender")?.trim().toUpperCase();
    const preferGender =
      preferGenderRaw &&
      ["MALE", "FEMALE", "NON_BINARY", "OTHER", "ALL"].includes(preferGenderRaw)
        ? preferGenderRaw
        : undefined;
    const limit = clampInt(searchParams.get("limit"), 10, 50);

    const feed = await matchingService.getFeed(auth.userId, {
      countrywide,
      radiusKm: radiusKm ?? undefined,
      minAge: minAge ?? undefined,
      maxAge: maxAge ?? undefined,
      preferGender: preferGender ?? undefined,
      limit: limit ?? undefined
    });

    const profiles = feed.map((c) => ({
      userId: c.userId,
      name: c.fullName,
      age: c.age,
      gender: c.gender,
      bio: c.bio,
      photoUrl: c.photoUrl,
      galleryPhotos: c.galleryPhotos ?? [],
      distance: c.distanceKm ?? undefined,
      tags: c.tags ?? [],
      commonInterests: c.commonInterests ?? [],
      compatibilityScore: Math.round(c.compatibilityScore * 100),
      isVerified: Boolean(c.isVerified),
      isOnline: Boolean(c.isOnline),
      isNewMember: Boolean(c.isNewMember)
    }));

    return ok(
      {
        items: feed,
        profiles,
        filters: {
          countrywide,
          radiusKm: radiusKm ?? null,
          minAge: minAge ?? null,
          maxAge: maxAge ?? null,
          preferGender: preferGender ?? "ALL"
        }
      },
      requestId
    );
  });
}
