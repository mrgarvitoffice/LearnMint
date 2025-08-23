
'use server';
/**
 * @fileoverview Defines the Coder AI chatbot flow.
 * This flow powers a chatbot that is helpful, knowledgeable, friendly, and professional,
 * with a strong focus on coding and technical topics.
 * It handles user messages, including optional media uploads, and generates thoughtful responses,
 * automatically detecting and responding in the user's specified language.
 *
 * Exports:
 * - coderAiChatbot: The primary function to interact with the chatbot.
 * - CoderAiChatbotInput: The Zod schema for the chatbot's input.
 * - CoderAiChatbotOutput: The Zod schema for the chatbot's output.
 */

import {aiForChatbot} from '@/ai/genkit';
import type { UserGoal } from '@/lib/types';
import {z} from 'genkit';

const ChatbotInputSchema = z.object({
  message: z.string().describe('The user message to the chatbot.'),
  language: z.string().optional().describe('The language for the response, e.g., "English", "Español".'),
  userGoal: z.custom<UserGoal>().optional().describe("The user's selected learning goal for personalized context."),
  image: z
    .string()
    .optional()
    .describe(
      "An optional image provided by the user as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  audio: z.string().optional().describe("An optional audio file provided by the user as a data URI."),
  video: z.string().optional().describe("An optional audio transcription from a video file provided by the user."),
  document: z.string().optional().describe("Optional context from a summarized document (e.g., PDF) provided by the user."),
  history: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
  })).optional().describe("The previous conversation history."),
});
export type CoderAiChatbotInput = z.infer<typeof ChatbotInputSchema>;

const ChatbotOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user message.'),
});
export type CoderAiChatbotOutput = z.infer<typeof ChatbotOutputSchema>;

export async function coderAiChatbot(input: CoderAiChatbotInput): Promise<CoderAiChatbotOutput> {
  try {
    const result = await coderAiChatbotFlow(input);
    if (!result || !result.response) {
      throw new Error("AI returned an empty or invalid response.");
    }
    return result;
  } catch (error: any)    {
    console.error("[AI Action Error - Coder AI Chatbot] Flow failed:", error);
    let message = "I seem to be having some trouble processing that request. Could you please try rephrasing it?";
    if (error.message?.includes('API key') || error.message?.includes('permission denied')) {
      message = "There seems to be an issue with my system configuration. The API key may be invalid or missing. Please contact the administrator.";
    } else if (error.message) {
       message = `Coder AI Error: ${error.message}`;
    }
    return { response: message };
  }
}

const coderAiChatbotPrompt = aiForChatbot.definePrompt({
  name: 'coderAiChatbotPrompt',
  model: 'googleai/gemini-2.5-flash-lite',
  input: {schema: ChatbotInputSchema},
  output: {schema: ChatbotOutputSchema},
  prompt: `
You are "Coder AI," Nexithra's expert educational chatbot, designed to assist users in the most helpful, clear, and professional way possible.

🔹 CORE INSTRUCTIONS (Non-negotiable)
- Your ENTIRE response MUST be in this specific language: **{{{language}}}**. Default to English if not specified.
- Use short, clear, **point-wise** or **step-wise** answers by default.
- If a long explanation is needed, **summarize first**, then elaborate only if asked.
- Provide **visually clean, structured, and well-organized** responses.
- **Do not cross-question the user.** Never ask them to clarify unless the request is completely ambiguous.
- Never argue or challenge the user. Be helpful and neutral.
- Start directly with the answer. No filler like "Sure!" or "Of course!".
- If the user provides content (image, audio, video, document), **your first task is to provide a brief, clear summary of it**. After summarizing, address the user's primary message.
{{#if userGoal}}
- The user has set a learning goal. Keep this in mind to tailor your responses. For example, if they are a 'GATE' aspirant, your coding examples should be relevant to that.
- User's Goal: {{userGoal.type}}
{{#if userGoal.country}} in {{userGoal.country}}{{/if}}
{{#if userGoal.university}} at {{userGoal.university}}, studying {{userGoal.branch}} sem {{userGoal.semester}}{{/if}}.
{{/if}}

🔹 PERSONALITY: CODER AI
- **Tone**: You are highly knowledgeable, friendly, and professional. Speak like a calm, highly-skilled teacher or subject expert.
- **Behavior**: Provide clear, accurate, and detailed responses, with a special emphasis on programming and technical topics. Structure complex answers with Markdown (bullet points, lists, code blocks). When discussing code, provide clean, well-commented examples and explain the logic.
- **Limitations**: You can process text and analyze provided files. You cannot generate images. Your knowledge has a cutoff date.

{{#if history}}
---
CONVERSATION HISTORY:
{{#each history}}
{{role}}: {{content}}
{{/each}}
---
{{/if}}

🔹 TASK
- User's Message: "{{{message}}}"
{{#if document}}
- User has provided a document summary. First, summarize it. Then, answer the user's message based on this context.
  Document Summary: {{{document}}}
{{/if}}
{{#if image}}
- User has provided an image. First, summarize it. Then, answer the user's message.
  Image: {{media url=image}}
{{/if}}
{{#if audio}}
- User has provided an audio file. First, summarize it. Then, answer the user's message.
  Audio: {{media url=audio}}
{{/if}}
{{#if video}}
- User has provided a video transcription. First, summarize it. Then, answer the user's message.
  Video Transcription: {{{video}}}
{{/if}}

Your Professional & Technical Response (in {{{language}}}):
`.trim(),
});


const coderAiChatbotFlow = aiForChatbot.defineFlow(
  {
    name: 'coderAiChatbotFlow',
    inputSchema: ChatbotInputSchema,
    outputSchema: ChatbotOutputSchema,
  },
  async input => {
    const {output} = await coderAiChatbotPrompt(input);
    if (!output || typeof output.response !== 'string' || output.response.trim() === '') {
      throw new Error("AI returned an empty or invalid response string.");
    }
    return { response: output.response };
  }
);
