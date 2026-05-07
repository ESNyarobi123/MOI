export type IcebreakerInput = {
  myName?: string;
  targetName?: string;
  targetBio?: string;
  interests?: string[];
};

export async function generateIcebreakersOpenAi(
  input: IcebreakerInput
): Promise<string[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const system =
    "You help write short, friendly dating-app openers. Reply with JSON only: {\"suggestions\": string[]} with exactly 3 items, each under 120 characters, no hashtags.";

  const userPayload = [
    input.myName ? `Me: ${input.myName}` : null,
    input.targetName ? `Them: ${input.targetName}` : null,
    input.targetBio ? `Their bio: ${input.targetBio}` : null,
    input.interests?.length ? `Shared or their interests: ${input.interests.join(", ")}` : null
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini",
        temperature: 0.85,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPayload || "Suggest 3 icebreakers." }
        ]
      })
    });
    if (!res.ok) {
      console.warn("[openai-icebreakers] HTTP", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { suggestions?: string[] };
    const list = parsed.suggestions?.filter((s) => typeof s === "string").slice(0, 3);
    return list?.length === 3 ? list : null;
  } catch (e) {
    console.warn("[openai-icebreakers] failed", e);
    return null;
  }
}
