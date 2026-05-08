export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "MoiDate API",
    version: "1.0.0",
    description: "Backend API for MoiDate dating platform."
  },
  servers: [
    { url: "https://apis.moidate.online/api/v1", description: "Production API" },
    { url: "/api/v1", description: "Local / relative" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  paths: {
    "/openapi": { get: { summary: "OpenAPI JSON document" } },
    "/swagger": { get: { summary: "Swagger UI" } },
    "/auth/register": {
      post: {
        summary: "Register with email + password (sends 6-digit email OTP)",
        description:
          "Creates unverified user; client must call /auth/verify-email with the code from email (dev: server logs code)."
      }
    },
    "/auth/verify-email": {
      post: {
        summary: "Verify email with OTP; returns access + refresh tokens",
        description: "Body: email, code (6 digits)."
      }
    },
    "/auth/resend-otp": {
      post: {
        summary: "Resend registration email OTP",
        description: "Body: email. Only before email is verified."
      }
    },
    "/auth/login": {
      post: {
        summary: "Login with email + password",
        description: "Requires email verified. Returns access + refresh tokens."
      }
    },
    "/auth/refresh": {
      post: {
        summary: "Rotate tokens using refresh token",
        description: "Body: refreshToken. Previous refresh token is invalidated."
      }
    },
    "/auth/logout": {
      post: {
        summary: "Revoke refresh token",
        description: "Body: refreshToken."
      }
    },
    "/auth/verify-age": { post: { summary: "Verify user age", security: [{ bearerAuth: [] }] } },
    "/users/me": {
      get: { summary: "Get my profile", security: [{ bearerAuth: [] }] },
      patch: { summary: "Update my profile", security: [{ bearerAuth: [] }] }
    },
    "/users/preferences": {
      put: { summary: "Update interests and looking-for", security: [{ bearerAuth: [] }] }
    },
    "/users/privacy": {
      put: { summary: "Update privacy controls", security: [{ bearerAuth: [] }] }
    },
    "/users/blocked": {
      get: { summary: "List blocked users", security: [{ bearerAuth: [] }] }
    },
    "/users/status": {
      post: { summary: "Set online/offline status", security: [{ bearerAuth: [] }] }
    },
    "/users/gallery": {
      get: { summary: "List gallery", security: [{ bearerAuth: [] }] },
      post: { summary: "Add gallery item by URL", security: [{ bearerAuth: [] }] }
    },
    "/users/gallery/{mediaId}": {
      delete: { summary: "Delete gallery item", security: [{ bearerAuth: [] }] }
    },
    "/users/{userId}/public": {
      get: {
        summary: "Public profile for matched user (no phone/email)",
        security: [{ bearerAuth: [] }],
        description: "Requires active match and showProfile; blocked users get 404."
      }
    },
    "/verification/request": {
      post: { summary: "Submit verification docs", security: [{ bearerAuth: [] }] }
    },
    "/verification/status": {
      get: { summary: "Get verification status", security: [{ bearerAuth: [] }] }
    },
    "/matching/feed": {
      get: {
        summary: "Discover feed (scored, distance, blocks excluded)",
        security: [{ bearerAuth: [] }],
        description:
          "Query: countrywide=true | radiusKm=5|10|50 (else uses profile.distanceKm). Requires lat/lng for tight radii; falls back to city/country."
      }
    },
    "/matching/swipe": { post: { summary: "Swipe user", security: [{ bearerAuth: [] }] } },
    "/matching/swipe/undo": {
      post: {
        summary: "Undo last swipe",
        security: [{ bearerAuth: [] }],
        description: "Removes last swipe; may remove match if mutual like breaks. Window: SWIPE_UNDO_WINDOW_MS."
      }
    },
    "/matching/matches": {
      get: { summary: "List my matches", security: [{ bearerAuth: [] }] }
    },
    "/notifications": {
      get: {
        summary: "List my notifications",
        security: [{ bearerAuth: [] }],
        description: "Query: limit (1–100, default 50). Newest first."
      }
    },
    "/notifications/read-all": {
      post: {
        summary: "Mark all notifications read",
        security: [{ bearerAuth: [] }]
      }
    },
    "/notifications/{notificationId}/read": {
      post: {
        summary: "Mark one notification read",
        security: [{ bearerAuth: [] }]
      }
    },
    "/subscription/plans": {
      get: {
        summary: "List subscription plans (public)",
        description: "No auth. Catalog for pricing / premium screen."
      }
    },
    "/subscription/me": {
      get: {
        summary: "My active subscription",
        security: [{ bearerAuth: [] }],
        description: "Returns null subscription if none active."
      }
    },
    "/subscription/subscribe": {
      post: {
        summary: "Deferred: start paid subscription",
        security: [{ bearerAuth: [] }],
        description: "Returns 501 until Stripe / checkout is implemented."
      }
    },
    "/help": {
      get: {
        summary: "Help & FAQ (public)",
        description: "Static FAQs and support email from SUPPORT_EMAIL."
      }
    },
    "/announcements": {
      get: {
        summary: "In-app announcements",
        security: [{ bearerAuth: [] }],
        description: "Recent platform announcements (no creator PII)."
      }
    },
    "/chat/list": {
      get: {
        summary: "List my chats",
        security: [{ bearerAuth: [] }],
        description: "Query: includeArchived=true to include archived threads."
      }
    },
    "/chat/{chatId}/settings": {
      patch: {
        summary: "Mute or archive chat (per participant)",
        security: [{ bearerAuth: [] }],
        description: "Body: isMuted?, isArchived?. Archive blocks sending until cleared."
      }
    },
    "/chat/stickers/packs": {
      get: { summary: "List active sticker packs", security: [{ bearerAuth: [] }] }
    },
    "/chat/stickers/packs/{slug}": {
      get: { summary: "Sticker pack by slug", security: [{ bearerAuth: [] }] }
    },
    "/chat/start": { post: { summary: "Start chat after active match", security: [{ bearerAuth: [] }] } },
    "/chat/messages": { get: { summary: "Get chat messages", security: [{ bearerAuth: [] }] } },
    "/chat/messages/send": { post: { summary: "Send chat message", security: [{ bearerAuth: [] }] } },
    "/chat/messages/seen": {
      post: { summary: "Mark chat messages as seen", security: [{ bearerAuth: [] }] }
    },
    "/chat/typing": {
      post: {
        summary: "Typing indicator (also broadcasts on Socket.io when server runs dev:full)",
        security: [{ bearerAuth: [] }]
      }
    },
    "/realtime/state": {
      get: {
        summary: "Read realtime presence/typing snapshot",
        security: [{ bearerAuth: [] }]
      }
    },
    "/safety/block": { post: { summary: "Block a user", security: [{ bearerAuth: [] }] } },
    "/safety/report": { post: { summary: "Report a user", security: [{ bearerAuth: [] }] } },
    "/safety/report-message": {
      post: { summary: "Report a message", security: [{ bearerAuth: [] }] }
    },
    "/location/update": { post: { summary: "Update location", security: [{ bearerAuth: [] }] } },
    "/location/nearby": { get: { summary: "Nearby users by city", security: [{ bearerAuth: [] }] } },
    "/location/travel-mode": {
      put: { summary: "Enable/disable travel mode", security: [{ bearerAuth: [] }] }
    },
    "/ai/icebreakers": {
      post: {
        summary: "Generate AI icebreakers",
        security: [{ bearerAuth: [] }],
        description:
          "Uses OpenAI chat (JSON) when OPENAI_API_KEY is set (OPENAI_CHAT_MODEL optional); else template lines. Matching feed uses OPENAI embeddings + cosine re-rank when key set; optional PINECONE_API_KEY adds tiny placeholder boost."
      }
    },
    "/ai/moderate-message": {
      post: {
        summary: "Moderate message text",
        security: [{ bearerAuth: [] }],
        description: "Uses OpenAI moderations when OPENAI_API_KEY is set; else keyword fallback."
      }
    },
    "/safety/emergency-plan": {
      get: { summary: "List emergency plans", security: [{ bearerAuth: [] }] },
      post: { summary: "Create emergency plan", security: [{ bearerAuth: [] }] }
    },
    "/safety/emergency-plan/{planId}/share-sms": {
      post: {
        summary: "SMS emergency contact via Twilio",
        security: [{ bearerAuth: [] }],
        description: "Requires TWILIO_* env. Marks plan isShared."
      }
    },
    "/media/upload": {
      post: {
        summary: "Deferred: media upload placeholder",
        security: [{ bearerAuth: [] }],
        description: "Reserved endpoint. Returns 501 until server-side media pipeline is enabled."
      }
    },
    "/payments/webhook": {
      post: {
        summary: "Deferred: payments webhook placeholder",
        description: "Reserved endpoint. Returns 501 until payment provider webhook setup is enabled."
      }
    },
    "/admin/users": {
      get: {
        summary: "Admin list users",
        security: [{ bearerAuth: [] }],
        description: "Bearer JWT for user with role ADMIN. Query: limit (1–200)."
      }
    },
    "/admin/users/suspend": {
      post: {
        summary: "Admin suspend/unsuspend user",
        security: [{ bearerAuth: [] }],
        description:
          "Requires role ADMIN. Blocked while user is banned (unban first)."
      }
    },
    "/admin/users/ban": {
      post: {
        summary: "Ban or unban user (revokes refresh tokens when banning)",
        security: [{ bearerAuth: [] }],
        description: "Requires role ADMIN. Body: userId, ban (boolean), reason (optional)."
      }
    },
    "/admin/users/{userId}/flags": {
      patch: {
        summary: "Trust & fake-account flags (admin notes)",
        security: [{ bearerAuth: [] }],
        description:
          "Requires role ADMIN. Body may include accountRiskNote (string|null), fakeAccountFlag (boolean)."
      }
    },
    "/admin/overview": {
      get: {
        summary: "Platform metrics (counts only, no chat content)",
        security: [{ bearerAuth: [] }],
        description: "Requires role ADMIN."
      }
    },
    "/admin/analytics": {
      get: {
        summary: "Extended analytics (active users 24h, signups 7d, totals)",
        security: [{ bearerAuth: [] }],
        description: "Requires role ADMIN."
      }
    },
    "/admin/engagement": {
      get: {
        summary: "Matches & chats summary (aggregates only)",
        security: [{ bearerAuth: [] }],
        description: "Requires role ADMIN. No message bodies or user pairing."
      }
    },
    "/admin/subscriptions": {
      get: {
        summary: "List subscription rows",
        security: [{ bearerAuth: [] }],
        description: "Requires role ADMIN. Query: limit."
      }
    },
    "/admin/payments": {
      get: {
        summary: "Payments / billing summary (Stripe deferred)",
        security: [{ bearerAuth: [] }],
        description: "Requires role ADMIN."
      }
    },
    "/admin/sticker-packs": {
      get: {
        summary: "List sticker packs (admin)",
        security: [{ bearerAuth: [] }],
        description: "Requires role ADMIN."
      }
    },
    "/admin/sticker-packs/{packId}": {
      patch: {
        summary: "Update sticker pack (e.g. isActive)",
        security: [{ bearerAuth: [] }],
        description: "Requires role ADMIN. Body: isActive?, name?"
      }
    },
    "/admin/subscription-plans": {
      get: {
        summary: "Subscription plans + subscription counts",
        security: [{ bearerAuth: [] }],
        description: "Requires role ADMIN. Billing/Stripe still deferred."
      }
    },
    "/admin/announcements": {
      get: {
        summary: "List in-app announcements",
        security: [{ bearerAuth: [] }],
        description: "Requires role ADMIN."
      },
      post: {
        summary: "Create announcement",
        security: [{ bearerAuth: [] }],
        description: "Requires role ADMIN. Body: title, body."
      }
    },
    "/admin/reports": {
      get: {
        summary: "Admin list safety reports",
        security: [{ bearerAuth: [] }],
        description: "Requires role ADMIN"
      }
    },
    "/admin/reports/{reportId}": {
      patch: {
        summary: "Update report status",
        security: [{ bearerAuth: [] }],
        description:
          "Requires role ADMIN. Body: status (OPEN | IN_REVIEW | RESOLVED | REJECTED)."
      }
    },
    "/admin/verification/pending": {
      get: {
        summary: "List pending ID/selfie verifications",
        security: [{ bearerAuth: [] }],
        description: "Requires role ADMIN"
      }
    },
    "/admin/verification/{recordId}/approve": {
      post: {
        summary: "Approve verification record",
        security: [{ bearerAuth: [] }],
        description: "Requires role ADMIN. Body optional: notes"
      }
    },
    "/admin/verification/{recordId}/reject": {
      post: {
        summary: "Reject verification record",
        security: [{ bearerAuth: [] }],
        description: "Requires role ADMIN. Body optional: notes"
      }
    }
  }
};
