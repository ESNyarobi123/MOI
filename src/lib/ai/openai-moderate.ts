export type ModerationApiResult = {
  flagged: boolean;
  categories?: Record<string, boolean>;
  source: "openai" | "keyword";
};

export async function moderateTextProduction(text: string): Promise<ModerationApiResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return moderateKeywordFallback(text);
  }

  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ model: "omni-moderation-latest", input: text })
    });
    if (!res.ok) {
      return moderateKeywordFallback(text);
    }
    const data = (await res.json()) as {
      results?: { flagged: boolean; categories?: Record<string, boolean> }[];
    };
    const r = data.results?.[0];
    return {
      flagged: Boolean(r?.flagged),
      categories: r?.categories,
      source: "openai"
    };
  } catch {
    return moderateKeywordFallback(text);
  }
}

function moderateKeywordFallback(text: string): ModerationApiResult {
  const lowered = text.toLowerCase();
  const abusive = ["stupid", "idiot", "hate", "kill", "rape", "nazi"].some((w) =>
    lowered.includes(w)
  );
  return { flagged: abusive, source: "keyword" };
}
