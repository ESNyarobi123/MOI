import { describe, expect, it } from "vitest";
import { signAccessToken } from "@/lib/auth/jwt";
import { openApiSpec } from "@/lib/docs/openapi";
import { POST as registerRoute } from "@/app/api/v1/auth/register/route";
import { POST as typingRoute } from "@/app/api/v1/chat/typing/route";
import { requireAuth } from "@/middleware/auth.middleware";

describe("API foundation", () => {
  it("exposes swagger paths for v1 endpoints", () => {
    expect(openApiSpec.paths["/auth/register"]).toBeDefined();
    expect(openApiSpec.paths["/matching/swipe"]).toBeDefined();
    expect(openApiSpec.paths["/admin/reports"]).toBeDefined();
    expect(openApiSpec.paths["/users/preferences"]).toBeDefined();
    expect(openApiSpec.paths["/verification/status"]).toBeDefined();
    expect(openApiSpec.paths["/chat/messages/seen"]).toBeDefined();
    expect(openApiSpec.paths["/chat/start"]).toBeDefined();
    expect(openApiSpec.paths["/safety/report-message"]).toBeDefined();
    expect(openApiSpec.paths["/users/status"]).toBeDefined();
    expect(openApiSpec.paths["/realtime/state"]).toBeDefined();
    expect(openApiSpec.paths["/location/travel-mode"]).toBeDefined();
    expect(openApiSpec.paths["/safety/emergency-plan"]).toBeDefined();
    expect(openApiSpec.paths["/ai/icebreakers"]).toBeDefined();
    expect(openApiSpec.paths["/auth/verify-email"]).toBeDefined();
    expect(openApiSpec.paths["/auth/resend-otp"]).toBeDefined();
    expect(openApiSpec.paths["/auth/refresh"]).toBeDefined();
    expect(openApiSpec.paths["/auth/logout"]).toBeDefined();
    expect(openApiSpec.paths["/matching/swipe/undo"]).toBeDefined();
    expect(openApiSpec.paths["/admin/verification/pending"]).toBeDefined();
    expect(openApiSpec.paths["/users/{userId}/public"]).toBeDefined();
    expect(openApiSpec.paths["/chat/{chatId}/settings"]).toBeDefined();
    expect(openApiSpec.paths["/chat/stickers/packs"]).toBeDefined();
    expect(openApiSpec.paths["/chat/stickers/packs/{slug}"]).toBeDefined();
    expect(openApiSpec.paths["/safety/emergency-plan/{planId}/share-sms"]).toBeDefined();
    expect(openApiSpec.paths["/admin/users/ban"]).toBeDefined();
    expect(openApiSpec.paths["/admin/overview"]).toBeDefined();
    expect(openApiSpec.paths["/admin/subscription-plans"]).toBeDefined();
    expect(openApiSpec.paths["/admin/announcements"]).toBeDefined();
    expect(openApiSpec.paths["/admin/reports/{reportId}"]).toBeDefined();
    expect(openApiSpec.paths["/admin/users/{userId}/flags"]).toBeDefined();
    expect(openApiSpec.paths["/admin/analytics"]).toBeDefined();
    expect(openApiSpec.paths["/admin/engagement"]).toBeDefined();
    expect(openApiSpec.paths["/admin/subscriptions"]).toBeDefined();
    expect(openApiSpec.paths["/admin/payments"]).toBeDefined();
    expect(openApiSpec.paths["/admin/sticker-packs"]).toBeDefined();
    expect(openApiSpec.paths["/admin/sticker-packs/{packId}"]).toBeDefined();
    expect(openApiSpec.paths["/notifications"]).toBeDefined();
    expect(openApiSpec.paths["/notifications/read-all"]).toBeDefined();
    expect(openApiSpec.paths["/notifications/{notificationId}/read"]).toBeDefined();
    expect(openApiSpec.paths["/subscription/plans"]).toBeDefined();
    expect(openApiSpec.paths["/subscription/me"]).toBeDefined();
    expect(openApiSpec.paths["/subscription/subscribe"]).toBeDefined();
    expect(openApiSpec.paths["/help"]).toBeDefined();
    expect(openApiSpec.paths["/announcements"]).toBeDefined();
  });

  it("rejects register request when required fields missing", async () => {
    const request = new Request("http://localhost/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "a@b.com" })
    });

    const response = await registerRoute(request as never);
    expect(response.status).toBe(400);
  });

  it("rejects auth guard when bearer token missing", () => {
    const request = new Request("http://localhost/api/v1/users/me");
    const result = requireAuth(request as never);
    expect(result).toBeInstanceOf(Response);
  });

  it("rejects typing request when chatId missing", async () => {
    const accessToken = signAccessToken("user_test", "test@example.com");
    const request = new Request("http://localhost/api/v1/chat/typing", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ typing: true })
    });

    const response = await typingRoute(request as never);
    expect(response.status).toBe(400);
  });
});
