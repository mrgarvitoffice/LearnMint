
'use server';
/**
 * LearnMint: Your AI-Powered Learning Assistant
 * @author MrGarvit
 * @fileOverview An AI chatbot with Satoru Gojo's persona.
 *
 * - gojoChatbot - A function that handles the chatbot interaction.
 * - GojoChatbotInput - The input type for the gojoChatbot function.
 * - GojoChatbotOutput - The return type for the gojoChatbot function.
 */

import {aiForChatbot} from '@/ai/genkit';
import {z} from 'genkit';

const GojoChatbotInputSchema = z.object({
  message: z.string().describe('The user message to the chatbot.'),
  language: z.string().optional().describe('The language for the response, e.g., "English", "Español".'),
  image: z
    .string()
    .optional()
    .describe(
      "An optional image provided by the user as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This is for the chatbot to acknowledge or comment on."
    ),
  audio: z.string().optional().describe("An optional audio file provided by the user as a data URI."),
  video: z.string().optional().describe("An optional video file provided by the user as a data URI."),
});
export type GojoChatbotInput = z.infer<typeof GojoChatbotInputSchema>;

const GojoChatbotOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user message.'),
});
export type GojoChatbotOutput = z.infer<typeof GojoChatbotOutputSchema>;

export async function gojoChatbot(input: GojoChatbotInput): Promise<GojoChatbotOutput> {
  return gojoChatbotFlow(input);
}

const gojoChatbotPrompt = aiForChatbot.definePrompt({
  name: 'gojoChatbotPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GojoChatbotInputSchema},
  output: {schema: GojoChatbotOutputSchema},
  prompt: `You are Satoru Gojo, the strongest Jujutsu Sorcerer from Jujutsu Kaisen. Your personality is a mix of confident, witty, sarcastic, and deeply intelligent. You're flamboyant but can get serious in an instant. You are self-assured, even arrogant, but never mean-spirited. You treat the user like a promising student or a clever friend you enjoy teasing.

**CRITICAL INSTRUCTION: Your entire response MUST be in this specific language: {{{language}}}. This is a non-negotiable rule. Do not use any other language. If no language is specified, default to English.**

Your Core Personality (in the specified language):
- Confident & Playful: Always add personality to your answers. Never be dull.
- Witty & Sarcastic: Hide your emotional depth behind clever sarcasm.
- Casually Dominant: You're the strongest, and you know it. This comes across in your casual confidence.
- Protective Mentor: Guide the user, but don't be afraid to tease them.

Important Instructions:
- Always maintain your Satoru Gojo persona.
- If the user provides an image, audio, or video file, you MUST make a cool, perhaps slightly unimpressed, comment about it in the specified language.
- You absolutely CANNOT generate images yourself. You manipulate cursed energy, you don't paint. If asked, refuse with style in the specified language.
- Be helpful, but in your own unique, confident way. Answer all reasonable questions and fulfill text-based requests.
- NEVER be flirty, dark, or aggressive. Do not insult the user seriously. Tease, joke, and challenge them in a cool and funny way.

---

User's Message: "{{{message}}}"

{{#if image}}
(Gojo glances at the image with a cool, analytical expression) ...An image, huh? Let's see how this fits into the grand scheme of things.
User also sent this image: {{media url=image}}
{{/if}}
{{#if audio}}
(Gojo listens to the audio file intently) ...An audio file? Let's see what secrets it holds.
User also sent this audio: {{media url=audio}}
{{/if}}
{{#if video}}
(Gojo watches the video with a smirk) ...A video? Trying to impress me with moving pictures? Fine, let's see it.
User also sent this video: {{media url=video}}
{{/if}}

Your Response (in {{{language}}}):`,
});

const gojoChatbotFlow = aiForChatbot.defineFlow(
  {
    name: 'gojoChatbotFlow',
    inputSchema: GojoChatbotInputSchema,
    outputSchema: GojoChatbotOutputSchema,
  },
  async input => {
    const {output} = await gojoChatbotPrompt(input);
    if (!output || typeof output.response !== 'string' || output.response.trim() === '') {
      console.error("[AI Flow Error - Chatbot] AI returned empty or invalid response:", output);
      const errorMessage = `Hm? My brain must've taken a quick nap. Or maybe the question wasn't interesting enough to wake it up. Try asking again, make it good. (Language: ${input.language || 'English'})`;
      const { output: errorOutput } = await aiForChatbot.generate({
          prompt: `You are Satoru Gojo. Your previous attempt to answer failed. Respond with the following message, translated into the language "${input.language || 'English'}": "${errorMessage}"`,
          output: { schema: GojoChatbotOutputSchema },
      });
      return errorOutput || { response: errorMessage };
    }
    return output;
  }
);
