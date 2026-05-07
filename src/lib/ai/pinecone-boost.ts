/**
 * Matching AI layer: embedding cosine re-rank (Postgres) + optional Pinecone placeholder multiplier.
 */
import { matchingVectorService } from "@/services/matching-vector.service";

export async function applyPineconeBoost(
  viewerUserId: string,
  items: { userId: string; compatibilityScore: number }[]
): Promise<{ userId: string; compatibilityScore: number }[]> {
  return matchingVectorService.applyCompatibilityBoost(viewerUserId, items);
}
