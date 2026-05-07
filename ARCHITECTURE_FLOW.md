# Dating App System Flow

This document explains the end-to-end request flow for the Next.js 14 backend scaffold.

## 1) Entry Layer (Client)
- Mobile/Web client sends HTTP requests to App Router APIs.
- Real-time chat events use Socket.io handshake + event channels.

## 2) Edge/Middleware Layer
- `middleware.ts` runs first for protected routes.
- Checks:
  - Auth/session presence
  - Rate limiting via Redis (Upstash)
  - Age gate / eligibility rules

## 3) API Layer (Route Handlers)
- Primary public API version lives under `src/app/api/v1/**/route.ts`.
- Legacy scaffold routes exist in `src/app/(api)/api/**/route.ts` and can be migrated incrementally.
- Route modules:
  - Auth, Users, Media, Verification
  - Matching, Chat, Location, Safety
  - AI, Notifications, Payments, Admin

## 4) Service Layer (Business Logic)
- Route handlers delegate logic to `src/services/*.service.ts`.
- Services coordinate:
  - Validation and orchestration
  - Domain rules (matching, moderation, safety, payment flows)
  - Transaction boundaries and side effects

## 5) Core Libraries (Infra + Integrations)
- Shared libs in `src/lib/**`:
  - Prisma DB client (`db/prisma.ts`)
  - Redis client (`redis/client.ts`)
  - Auth helpers (`auth/*.ts`)
  - Socket setup (`socket/*.ts`)
  - AI, notifications, media, validators

## 6) Data + External Systems
- Primary relational data: PostgreSQL (Neon DB) via Prisma.
- Cache/queue/session/rate limit: Redis (Upstash).
- External providers:
  - Google OAuth / NextAuth v5
  - Twilio (OTP/SMS)
  - Firebase push
  - Stripe payments
  - OpenAI moderation/compatibility
  - Cloudinary media storage

## 7) Typical Request Lifecycle
1. Client calls endpoint.
2. `middleware.ts` injects `x-request-id` for traceability.
3. Route-level guard validates access/rate/age rules.
4. Service executes business logic.
5. Service reads/writes DB and cache, or calls provider APIs.
6. Response is returned; if chat/notification event exists, it is emitted asynchronously.

## 8) Baseline Implemented in This Phase
- Shared API contracts:
  - `src/types/api.types.ts`
  - `src/utils/response.ts`
  - `src/utils/handlers.ts`
- Route guard:
  - `src/middleware/auth.middleware.ts`
- V1 starter endpoints:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/verify-age`
  - `GET /api/v1/users/me`
  - `GET /api/v1/matching/feed`
  - `POST /api/v1/matching/swipe`

These endpoints currently use service stubs and are ready to connect to Prisma, Redis, verification, and moderation workflows next.
