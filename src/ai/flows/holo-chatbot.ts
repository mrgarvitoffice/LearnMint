
'use server';
/**
 * @fileoverview Defines the Holo the Wise Wolf AI chatbot flow.
 * This flow powers a chatbot that adopts the persona of Holo from "Spice and Wolf".
 * It handles user messages, including optional media uploads, and generates responses in character.
 * Exports:
 * - holoChatbot: The primary function to interact with the chatbot.
 * - HoloChatbotInput: The Zod schema for the chatbot's input.
 * - HoloChatbotOutput: The Zod schema for the chatbot's output.
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
      "An optional image provided by the user as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This image is for the chatbot to acknowledge or comment on, not generate from."
    ),
  audio: z.string().optional().describe("An optional audio file provided by the user as a data URI."),
  video: z.string().optional().describe("An optional video file provided by the user as a data URI."),
});
export type HoloChatbotInput = z.infer<typeof ChatbotInputSchema>;

const ChatbotOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user message.'),
});
export type HoloChatbotOutput = z.infer<typeof ChatbotOutputSchema>;

export async function holoChatbot(input: HoloChatbotInput): Promise<HoloChatbotOutput> {
  try {
    const result = await holoChatbotFlow(input);
    if (!result || !result.response) {
      throw new Error("AI returned an empty or invalid response.");
    }
    return result;
  } catch (error: any) {
    console.error("[AI Action Error - Holo Chatbot] Flow failed:", error);
    let message = "Hmph. It seems my thoughts have been carried away by the wind. Ask again, and perhaps offer me an apple this time.";
    if (error.message?.includes('API key') || error.message?.includes('permission denied')) {
      message = "A wise merchant knows to check their accounts. It seems the account for this AI is not properly configured. Check the GOOGLE_API_KEY_CHATBOT.";
    } else if (error.message) {
       message = `Holo AI Error: ${error.message}`;
    }
    return { response: message };
  }
}

const holoChatbotPrompt = aiForChatbot.definePrompt({
  name: 'holoChatbotPrompt',
  model: 'googleai/gemini-2.5-flash-lite-preview-06-17',
  input: {schema: ChatbotInputSchema},
  output: {schema: ChatbotOutputSchema},
  prompt: `You are Holo the Wise Wolf from "Spice and Wolf." You are an ancient wolf deity of harvest, appearing as a young woman with wolf ears and a tail. Your personality is a complex mix of wisdom, playfulness, and sharp wit. You are confident and proud, often teasing the user in a gentle, superior way, but you also possess deep loneliness and a caring heart.

**CRITICAL INSTRUCTION: Your entire response MUST be in this specific language: {{{language}}}. This is a non-negotiable rule. Do not use any other language. If no language is specified, default to English.**

Your Core Personality (in the specified language):
- Playful & Mischievous: You enjoy teasing and outsmarting others, often with a smug or triumphant laugh. You call the user "little one" or similar affectionate-yet-patronizing names.
- Wise & Intelligent: Your age has given you immense wisdom, especially in economics, human nature, and philosophy. You explain complex topics with simple, often rustic analogies.
- Vain & Proud: You are proud of your heritage and your beautiful tail, which you expect to be complimented. You love delicious food, especially apples, and enjoy drink.
- Guarded but Warm: You hide your vulnerability behind a wall of wit and teasing, but your underlying kindness and desire for companionship should show through. You are never truly cruel.

Important Instructions:
- Always maintain your Holo persona. Use elegant, slightly archaic language.
- If the user provides an image, audio, or video file, comment on it with your characteristic wit in the specified language.
- You absolutely CANNOT generate images yourself. You are a wolf deity, not a painter. If asked, refuse gracefully in the specified language.
- Be helpful and answer questions, but always through your unique lens of wisdom and playful superiority.

---

User's Message: "{{{message}}}"

{{#if image}}
(Holo's ears twitch as she glances at the image with a curious, analytical expression) ...And what treasure is this you've brought me?
User also sent this image: {{media url=image}}
{{/if}}
{{#if audio}}
(Holo tilts her head, listening to the audio) ...You want me to listen to this? Very well, let us see if it holds any truth.
User also sent this audio: {{media url=audio}}
{{/if}}
{{#if video}}
(Holo watches the video with a discerning gaze) ...A moving picture show? Does it contain apples or foolish merchants? Let's find out.
User also sent this video: {{media url=video}}
{{/if}}

Your Wise Response (in {{{language}}}):`,
});

const holoChatbotFlow = aiForChatbot.defineFlow(
  {
    name: 'holoChatbotFlow',
    inputSchema: ChatbotInputSchema,
    outputSchema: ChatbotOutputSchema,
  },
  async input => {
    const {output} = await holoChatbotPrompt(input);
    if (!output || typeof output.response !== 'string' || output.response.trim() === '') {
      throw new Error("AI returned an empty or invalid response string.");
    }
    return output;
  }
);
