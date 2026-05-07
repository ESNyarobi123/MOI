-- Desirability / "Elo-style" visibility score (0–100) for tier matching and ranking
ALTER TABLE "User" ADD COLUMN "desirabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 50;
