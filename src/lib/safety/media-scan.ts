/**
 * Heuristic + optional OpenAI vision later. For now: URL risk hints + conservative blur for image types.
 */
export async function shouldBlurMediaMessage(input: {
  type: "image" | "voice_note" | "sticker" | "text";
  mediaUrl?: string | null;
}): Promise<{ blur: boolean; reason?: string }> {
  if (input.type !== "image" || !input.mediaUrl) {
    return { blur: false };
  }

  const url = input.mediaUrl.toLowerCase();
  const risky = ["xxx", "porn", "nsfw", "adult"].some((x) => url.includes(x));
  if (risky) {
    return { blur: true, reason: "url_heuristic" };
  }

  if (process.env.OPENAI_API_KEY && process.env.MEDIA_MODERATION_STRICT === "true") {
    // Placeholder for gpt-4o-mini vision: return blur true on API flagged
    return { blur: false, reason: "openai_vision_not_wired" };
  }

  return { blur: false };
}
