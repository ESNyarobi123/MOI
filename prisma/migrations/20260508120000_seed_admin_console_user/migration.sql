-- Default MoiDate operations console user (idempotent).
-- Login: admin@moidate.com / Moidate@2026
-- Password is bcrypt cost 12. Rotate after first login in production.

INSERT INTO "User" (
  "id",
  "email",
  "passwordHash",
  "emailVerified",
  "isAgeVerified",
  "ageVerifiedAt",
  "role",
  "isActive",
  "isSuspended",
  "isBanned",
  "fakeAccountFlag",
  "createdAt",
  "updatedAt"
)
SELECT
  'cm_seed_admin_moidate_01',
  'admin@moidate.com',
  '$2a$12$AJTu.cC4Hy0QDDEAxc5L6eFSyAaWAc6CJiSwKJV77Pz3V6ghGwdPa',
  true,
  true,
  CURRENT_TIMESTAMP,
  'ADMIN',
  true,
  false,
  false,
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "User" WHERE "email" = 'admin@moidate.com'
);

UPDATE "User" SET
  "passwordHash" = '$2a$12$AJTu.cC4Hy0QDDEAxc5L6eFSyAaWAc6CJiSwKJV77Pz3V6ghGwdPa',
  "role" = 'ADMIN',
  "emailVerified" = true,
  "isActive" = true,
  "isSuspended" = false,
  "isBanned" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "email" = 'admin@moidate.com';
