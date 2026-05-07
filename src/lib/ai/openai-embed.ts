import { createHash } from "node:crypto";
import { cacheGetJson, cacheSetJson } from "@/lib/infra/cache";

const CACHE_TTL_SEC = 60 * 60 * 24 * 14;

function sha256Hex(text: string) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export async function fetchOpenAiEmbedding(text: string): Promise<number[] | null> {
  const key = `emb:${sha256Hex(text)}`;
  const cached = await cacheGetJson<number[]>(key);
  if (cached?.length) return cached;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";

  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ model, input: text })
    });
    if (!res.ok) {
      console.warn("[openai-embed] embeddings HTTP", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as {
      data?: { embedding?: number[] }[];
    };
    const emb = data.data?.[0]?.embedding;
    if (!emb?.length) return null;
    await cacheSetJson(key, emb, CACHE_TTL_SEC);
    return emb;
  } catch (e) {
    console.warn("[openai-embed] failed", e);
    return null;
  }
}
