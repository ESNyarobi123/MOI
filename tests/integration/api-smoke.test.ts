import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET as openApiGet } from "@/app/api/v1/openapi/route";
import { POST as loginPost } from "@/app/api/v1/auth/login/route";
import { POST as moderatePost } from "@/app/api/v1/ai/moderate-message/route";
import { GET as adminOverviewGet } from "@/app/api/v1/admin/overview/route";
import { GET as adminPlansGet } from "@/app/api/v1/admin/subscription-plans/route";
import { GET as stickerPacksGet } from "@/app/api/v1/chat/stickers/packs/route";
import { GET as chatListGet } from "@/app/api/v1/chat/list/route";
import { GET as feedGet } from "@/app/api/v1/matching/feed/route";
import { GET as matchesGet } from "@/app/api/v1/matching/matches/route";
import { GET as emergencyListGet } from "@/app/api/v1/safety/emergency-plan/route";
import { GET as blockedGet } from "@/app/api/v1/users/blocked/route";
import { GET as meGet } from "@/app/api/v1/users/me/route";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";

function jsonRequest(
  method: string,
  pathname: string,
  init?: { body?: unknown; token?: string }
) {
  const url = `http://localhost${pathname}`;
  const headers = new Headers();
  headers.set("x-request-id", crypto.randomUUID());
  if (init?.body !== undefined) {
    headers.set("content-type", "application/json");
  }
  if (init?.token) {
    headers.set("authorization", `Bearer ${init.token}`);
  }
  return new NextRequest(url, {
    method,
    headers,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined
  });
}

describe("API smoke (live DB + route handlers)", () => {
  const password = "TestSmokeApi12!";
  let email: string;
  let userId: string;
  let accessToken: string;

  beforeAll(async () => {
    await prisma.$connect();
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    email = `apitest_${suffix}@example.com`;
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        role: "ADMIN",
        emailVerified: true,
        isAgeVerified: true,
        isActive: true,
        isSuspended: false,
        passwordHash,
        profile: {
          create: {
            fullName: "API Smoke User",
            dateOfBirth: new Date(1995, 5, 15),
            gender: "MALE",
            city: "Nairobi",
            country: "KE",
            lookingFor: ["DATING"]
          }
        }
      }
    });
    userId = user.id;
  }, 60_000);

  afterAll(async () => {
    if (userId) {
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    await prisma.$disconnect();
  });

  it("GET /openapi returns spec", async () => {
    const res = await openApiGet();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { openapi?: string };
    expect(body.openapi).toBe("3.0.3");
  });

  it("POST /auth/login issues tokens", async () => {
    const res = await loginPost(
      jsonRequest("POST", "/api/v1/auth/login", {
        body: { email, password }
      })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      data: { accessToken: string };
    };
    expect(body.ok).toBe(true);
    expect(body.data.accessToken?.length).toBeGreaterThan(10);
    accessToken = body.data.accessToken;
  });

  it("GET /users/me with Bearer", async () => {
    const res = await meGet(jsonRequest("GET", "/api/v1/users/me", { token: accessToken }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; data: { userId: string } };
    expect(body.ok).toBe(true);
    expect(body.data.userId).toBe(userId);
  });

  it("GET /matching/feed?countrywide=true", async () => {
    const req = jsonRequest("GET", "/api/v1/matching/feed?countrywide=true", {
      token: accessToken
    });
    const res = await feedGet(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; data: { items: unknown[] } };
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data.items)).toBe(true);
  });

  it("GET /chat/list", async () => {
    const res = await chatListGet(
      jsonRequest("GET", "/api/v1/chat/list", { token: accessToken })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; data: { items: unknown[] } };
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data.items)).toBe(true);
  });

  it("GET /admin/overview (JWT role ADMIN)", async () => {
    const res = await adminOverviewGet(
      jsonRequest("GET", "/api/v1/admin/overview", { token: accessToken })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      data: { totalUsers: number };
    };
    expect(body.ok).toBe(true);
    expect(typeof body.data.totalUsers).toBe("number");
  });

  it("GET /admin/subscription-plans", async () => {
    const res = await adminPlansGet(
      jsonRequest("GET", "/api/v1/admin/subscription-plans", {
        token: accessToken
      })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; data: { items: unknown[] } };
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data.items)).toBe(true);
  });

  it("GET /matching/matches", async () => {
    const res = await matchesGet(
      jsonRequest("GET", "/api/v1/matching/matches", { token: accessToken })
    );
    expect(res.status).toBe(200);
  });

  it("GET /users/blocked", async () => {
    const res = await blockedGet(
      jsonRequest("GET", "/api/v1/users/blocked", { token: accessToken })
    );
    expect(res.status).toBe(200);
  });

  it("GET /safety/emergency-plan", async () => {
    const res = await emergencyListGet(
      jsonRequest("GET", "/api/v1/safety/emergency-plan", { token: accessToken })
    );
    expect(res.status).toBe(200);
  });

  it("GET /chat/stickers/packs", async () => {
    const res = await stickerPacksGet(
      jsonRequest("GET", "/api/v1/chat/stickers/packs", { token: accessToken })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; data: { items: unknown[] } };
    expect(Array.isArray(body.data.items)).toBe(true);
  });

  it("POST /ai/moderate-message", async () => {
    const res = await moderatePost(
      jsonRequest("POST", "/api/v1/ai/moderate-message", {
        token: accessToken,
        body: { text: "Hello, want to grab coffee this weekend?" }
      })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; data: { flagged: boolean } };
    expect(body.ok).toBe(true);
    expect(typeof body.data.flagged).toBe("boolean");
  });
});
