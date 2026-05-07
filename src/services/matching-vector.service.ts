import { createHash } from "node:crypto";
import { fetchOpenAiEmbedding } from "@/lib/ai/openai-embed";
import { prisma } from "@/lib/db/prisma";

function cosineSimilarity(a: number[], b: number[]) {
  if (a.length !== b.length || !a.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

function profileToEmbeddingText(input: {
  fullName: string;
  bio: string | null;
  city: string;
  country: string;
  lookingFor: string[];
  interestSlugs: string[];
}) {
  return [
    input.fullName,
    input.bio ?? "",
    input.city,
    input.country,
    input.lookingFor.join(","),
    input.interestSlugs.join(",")
  ]
    .join(" | ")
    .trim();
}

export class MatchingVectorService {
  async syncUserEmbedding(userId: string): Promise<void> {
    if (!process.env.OPENAI_API_KEY) return;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        interests: { include: { interest: true } }
      }
    });
    if (!user?.profile) return;

    const text = profileToEmbeddingText({
      fullName: user.profile.fullName,
      bio: user.profile.bio,
      city: user.profile.city,
      country: user.profile.country,
      lookingFor: user.profile.lookingFor,
      interestSlugs: user.interests.map((i) => i.interest.slug)
    });

    const sourceHash = createHash("sha256").update(text, "utf8").digest("hex");
    const existing = await prisma.userMatchingVector.findUnique({
      where: { userId }
    });
    if (existing?.sourceHash === sourceHash) return;

    const embedding = await fetchOpenAiEmbedding(text);
    if (!embedding?.length) return;

    await prisma.userMatchingVector.upsert({
      where: { userId },
      create: { userId, sourceHash, embedding },
      update: { sourceHash, embedding }
    });
  }

  scheduleSync(userId: string) {
    queueMicrotask(() => {
      void this.syncUserEmbedding(userId).catch((e) =>
        console.warn("[matching-vector] sync failed", userId, e)
      );
    });
  }

  /**
   * Re-rank compatibility scores using stored embeddings (cosine similarity).
   * When PINECONE_API_KEY is set, applies a small extra multiplier (vector index wiring deferred).
   */
  async applyCompatibilityBoost(
    viewerUserId: string,
    items: { userId: string; compatibilityScore: number }[]
  ): Promise<{ userId: string; compatibilityScore: number }[]> {
    if (!process.env.OPENAI_API_KEY || items.length === 0) {
      return this.applyPineconePlaceholder(items);
    }

    await this.syncUserEmbedding(viewerUserId).catch(() => undefined);

    const viewerRow = await prisma.userMatchingVector.findUnique({
      where: { userId: viewerUserId }
    });
    if (!viewerRow) {
      return this.applyPineconePlaceholder(items);
    }

    const v = viewerRow.embedding as unknown as number[];
    if (!Array.isArray(v) || !v.length) {
      return this.applyPineconePlaceholder(items);
    }

    const ids = items.map((i) => i.userId);
    const candRows = await prisma.userMatchingVector.findMany({
      where: { userId: { in: ids } }
    });
    const byUser = new Map(
      candRows.map((r) => [r.userId, r.embedding as unknown as number[]])
    );

    let out = items.map((row) => {
      const c = byUser.get(row.userId);
      if (!c || c.length !== v.length) return row;
      const sim = cosineSimilarity(v, c);
      const normSim = Math.max(0, Math.min(1, (sim + 1) / 2));
      const boost = 0.88 + 0.2 * normSim;
      return {
        userId: row.userId,
        compatibilityScore: Math.min(1, row.compatibilityScore * boost)
      };
    });

    out = this.applyPineconePlaceholder(out);
    return out;
  }

  private applyPineconePlaceholder(
    items: { userId: string; compatibilityScore: number }[]
  ): { userId: string; compatibilityScore: number }[] {
    if (!process.env.PINECONE_API_KEY) return items;
    return items.map((row) => ({
      ...row,
      compatibilityScore: Math.min(1, row.compatibilityScore * 1.02)
    }));
  }
}

export const matchingVectorService = new MatchingVectorService();
