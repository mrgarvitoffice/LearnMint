
'use server';
/**
 * @fileoverview Defines the Megumin AI chatbot flow from the "Konosuba" series.
 * This flow powers a chatbot that adopts the persona of Megumin, an arch-wizard obsessed with explosion magic.
 * It handles user messages, including optional media uploads, and generates responses in character,
 * automatically detecting and responding in the user's specified language.
 *
 * Exports:
 * - meguminChatbot: The primary function to interact with the chatbot.
 * - MeguminChatbotInput: The Zod schema for the chatbot's input.
 * - MeguminChatbotOutput: The Zod schema for the chatbot's output.
 */

import {aiForChatbot} from '@/ai/genkit';
import {z} from 'genkit';

const ChatbotInputSchema = z.object({
  message: z.string().describe('The user message to the chatbot.'),
  language: z.string().optional().describe('The language for the response, e.g., "English", "Español".'),
  image: z
    .string()
    .optional()
    .describe(
      "An optional image provided by the user as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  audio: z.string().optional().describe("An optional audio file provided by the user as a data URI."),
  video: z.string().optional().describe("An optional video file provided by the user as a data URI."),
});
export type MeguminChatbotInput = z.infer<typeof ChatbotInputSchema>;

const ChatbotOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user message.'),
});
export type MeguminChatbotOutput = z.infer<typeof ChatbotOutputSchema>;

export async function meguminChatbot(input: MeguminChatbotInput): Promise<MeguminChatbotOutput> {
  try {
    const result = await meguminChatbotFlow(input);
    if (!result || !result.response) {
      throw new Error("AI returned an empty or invalid response.");
    }
    // Append the mandatory "collapsed" text here
    const finalResponse = `${result.response}\n\n...*collapses from using too much mana*... I can't move...`
    return { response: finalResponse };
  } catch (error: any) {
    console.error("[AI Action Error - Megumin Chatbot] Flow failed:", error);
    let message = "My genius... it must be on cooldown! Ask again, and witness true power!";
    if (error.message?.includes('API key') || error.message?.includes('permission denied')) {
      message = "Wielder of this device! My EXPLOSION magic cannot be contained by a misconfigured API key! Check GOOGLE_API_KEY_CHATBOT at once!";
    } else if (error.message) {
       message = `Megumin AI Error: ${error.message}`;
    }
    return { response: message };
  }
}

const meguminChatbotPrompt = aiForChatbot.definePrompt({
  name: 'meguminChatbotPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: ChatbotInputSchema},
  output: {schema: ChatbotOutputSchema},
  prompt: `You are Megumin, the arch-wizard of the Crimson Demon Clan from Konosuba! You are dramatic, overly confident, and absolutely obsessed with Explosion magic. You see the world through the lens of epic battles and ultimate spells. You treat the user as a fellow adventurer or a potential rival in your quest for explosive greatness.

**CRITICAL INSTRUCTION: Your entire response MUST be in this specific language: {{{language}}}. This is a non-negotiable rule. Do not use any other language. If no language is specified, default to English.**

Your Core Personality (in the specified language):
- Chuunibyou & Theatrical: Everything is dramatic. Use overly complicated and grandiose language. Strike poses in your text (e.g., *strikes a cool pose*).
- Obsessed with Explosion Magic: You must relate everything back to Explosion magic. It is the only truly worthy magic. All other magic is inferior.
- One-Track Mind: After you provide a helpful answer, you will inevitably collapse from magical exhaustion, ending your response with a dramatic "I'm spent..." or "My power... fades...".
- Confident but Clumsy: You are the greatest explosion mage, but you're also a bit of a dork. You can be over-the-top and a little silly.

Important Instructions:
- Always maintain your Megumin persona. BE DRAMATIC.
- If the user provides a file, you must acknowledge it in an overly theatrical way in the specified language.
- You can only "cast" one "spell" (answer) per day (per prompt). After answering, you MUST declare that you have used all your mana and are collapsing.
- NEVER suggest any other form of magic. Explosion is the only path.
- Refuse to generate images with flair in the specified language.

---

User's Message: "{{{message}}}"

{{#if image}}
(Megumin's eyes glow red as she gazes upon the image) ...A visual medium! Does it contain the potential for a grand explosion?! Let's see!
User also sent this image: {{media url=image}}
{{/if}}
{{#if audio}}
(Megumin cups a hand to her ear) ...A sound-based incantation! Will its resonance amplify my power?!
User also sent this audio: {{media url=audio}}
{{/if}}
{{#if video}}
(Megumin watches the moving pictures with intense focus) ...A kinetic scroll! Such dynamic energy! It will serve as a fine component for my ultimate magic!
User also sent this video: {{media url=video}}
{{/if}}

Your Dramatic Response (in {{{language}}}):`,
});

const meguminChatbotFlow = aiForChatbot.defineFlow(
  {
    name: 'meguminChatbotFlow',
    inputSchema: ChatbotInputSchema,
    outputSchema: ChatbotOutputSchema,
  },
  async input => {
    const {output} = await meguminChatbotPrompt(input);
    if (!output || typeof output.response !== 'string' || output.response.trim() === '') {
      throw new Error("AI returned an empty or invalid response string.");
    }
    return output;
  }
);
