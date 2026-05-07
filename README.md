# MoiDate Backend (Next.js 14)

Production-oriented backend scaffold for a dating platform with:
- Auth + 18+ gate
- Matching + chat foundations
- Safety and moderation
- Admin controls
- Prisma/PostgreSQL schema + migration
- OpenAPI/Swagger docs

## Run

```bash
npm install
npm run dev
```

## Auth (email + password + email OTP)

1. `POST /api/v1/auth/register` — email, password, fullName, age, gender (optional `phone`). Password min 8 chars. Server sends **6-digit OTP** (development: printed to server logs; production: configure email provider).
2. `POST /api/v1/auth/verify-email` — `email`, `code` → returns **accessToken** + **refreshToken**.
3. `POST /api/v1/auth/resend-otp` — `email` if code expired (unverified accounts only).
4. `POST /api/v1/auth/login` — `email`, `password` (requires verified email).
5. `POST /api/v1/auth/refresh` — `refreshToken` (rotates refresh token).
6. `POST /api/v1/auth/logout` — `refreshToken` (revokes that session).

Protected routes: `Authorization: Bearer <accessToken>`. Set **`JWT_SECRET`** in `.env` / `.env.local` (not the `replace_me` placeholder).

## Database (Neon / PostgreSQL)

1. Set **`DATABASE_URL`** in **`.env.local`** or **`.env`** (one line, no `export`):

   ```bash
   DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/neondb?sslmode=require"
   ```

   If this variable is missing or the file is empty, `prisma migrate deploy` fails with **P1012 Environment variable not found: DATABASE_URL**.

2. Apply migrations to the remote database:

```bash
npm run prisma:migrate:neon
```

For local Postgres during development you can use `npm run prisma:migrate:dev` instead (with `DATABASE_URL` set).

## Verification (user + admin)

- User: `POST /api/v1/verification/request` (needs `idDocUrl` and/or `selfieUrl`), `GET /api/v1/verification/status`.
- Optional vendor hook: set `KYC_VENDOR_WEBHOOK_URL` (stub logs today).
- Admin (`Authorization: Bearer` + `x-admin-role: admin`):  
  `GET /api/v1/admin/verification/pending`,  
  `POST /api/v1/admin/verification/{recordId}/approve`,  
  `POST /api/v1/admin/verification/{recordId}/reject` (body optional `notes`).

## Matching

- Feed: `GET /api/v1/matching/feed?countrywide=true` or `radiusKm=5|10|50` (otherwise uses `profile.distanceKm`). Excludes blocked users, already-swiped, suspended, unverified emails; scores interests + lookingFor + distance + age; optional Pinecone hook via `PINECONE_API_KEY` (light boost placeholder).
- `POST /api/v1/matching/swipe/undo` — undo last swipe within `SWIPE_UNDO_WINDOW_MS` (default 24h); may drop a match if mutual like breaks.
- Superlikes per day: `SUPERLIKES_PER_DAY` (default 5).

## API docs

- OpenAPI JSON: `/api/v1/openapi`
- Swagger UI: `/api/v1/swagger`

## Tests

```bash
npm test
```
