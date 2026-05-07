import { generateIcebreakersOpenAi } from "@/lib/ai/openai-icebreakers";
import { moderateTextProduction } from "@/lib/ai/openai-moderate";

export class AiService {
  async generateIcebreakers(input: {
    myName?: string;
    targetName?: string;
    targetBio?: string;
    interests?: string[];
  }) {
    const fromOpenAi = await generateIcebreakersOpenAi(input);
    if (fromOpenAi) {
      return { suggestions: fromOpenAi, source: "openai" as const };
    }

    const name = input.targetName ?? "there";
    const topic = input.interests?.[0] ?? "your hobbies";
    return {
      suggestions: [
        `Hey ${name}, what got you into ${topic}?`,
        `Hi ${name}, your bio caught my eye. What does your ideal weekend look like?`,
        `Hey ${name}, random question: coffee date or beach walk?`
      ],
      source: "template" as const
    };
  }

  async moderateText(text: string) {
    const mod = await moderateTextProduction(text);
    return {
      flagged: mod.flagged,
      label: mod.flagged ? "moderation_flagged" : "clean",
      confidence: mod.flagged ? 0.9 : 0.12,
      source: mod.source,
      categories: mod.categories
    };
  }
}

export const aiService = new AiService();
