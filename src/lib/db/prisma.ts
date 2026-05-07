import { PrismaClient } from "@prisma/client";
import { databaseUrlLooksPlaceholder } from "@/lib/db/database-env";

declare global {
  // eslint-disable-next-line no-var
  var __moi_prisma__: PrismaClient | undefined;
}

if (databaseUrlLooksPlaceholder(process.env.DATABASE_URL)) {
  console.warn(
    "\n[MoiDate] DATABASE_URL is missing or still uses a placeholder (e.g. YOUR-NEON-HOST).\n" +
      "  Set a real Postgres URI in .env.local from https://console.neon.tech — then restart dev.\n"
  );
}

export const prisma =
  global.__moi_prisma__ ??
  new PrismaClient({
    log: ["error", "warn"]
  });

if (process.env.NODE_ENV !== "production") {
  global.__moi_prisma__ = prisma;
}
