/**
 * @fileoverview Defines the primary Genkit flow for generating comprehensive study notes.
 * This flow creates well-structured, Markdown-formatted notes for a given topic.
 * It also identifies opportunities for visual aids and calls the `generate-image-from-prompt` flow
 * to create and embed relevant images directly into the notes.
 * Exports:
 * - generateStudyNotes: The main function to generate notes with embedded images.
 * - GenerateStudyNotesInput: The Zod schema for the input.
 * - GenerateStudyNotesOutput: The Zod schema for the output.
 */

'use server';

import {aiForNotes} from '@/ai/genkit'; 
import {z} from 'zod';
import { generateImageFromPrompt } from './generate-image-from-prompt';

const GenerateStudyNotesInputSchema = z.object({
  topic: z.string().describe('The academic topic for which to generate study notes.'),
  notes: z.string().optional().describe('Optional user-provided notes to use as the primary source material for generation.'),
  image: z.string().optional().describe(
    "An optional image provided by the user as a data URI for context. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  audio: z.string().optional().describe("An optional audio file provided by the user as a data URI for context."),
  video: z.string().optional().describe("An optional audio transcription from a video file provided by the user."),
});
export type GenerateStudyNotesInput = z.infer<typeof GenerateStudyNotesInputSchema>;

const GenerateStudyNotesOutputSchema = z.object({
  notes: z.string().describe("Comprehensive, well-structured study notes in Markdown format.")
});
export type GenerateStudyNotesOutput = z.infer<typeof GenerateStudyNotesOutputSchema>;

const generateStudyNotesPrompt = aiForNotes.definePrompt({
  name: 'generateStudyNotesPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: GenerateStudyNotesInputSchema },
  output: { format: 'text' }, // Request raw Markdown text for higher reliability
  prompt: `You are an expert multilingual educator. Your primary task is to create engaging, well-structured study notes in Markdown.

**CRITICAL INSTRUCTION 1: LANGUAGE DETECTION**
Your first and most important task is to meticulously analyze the user's topic: "{{{topic}}}".
- If a specific human language is requested (e.g., "Quantum Physics in Spanish", "ハリー・ポッターのキャラクター", "piano in Sanskrit"), you **MUST** generate the entire notes content in that exact language.
- If the topic itself is written in a non-English language (e.g., Devanagari, Cyrillic, Kanji), you **MUST** generate the notes in that same language.
- If no language is specified and the topic is in English, generate the notes in English.

**CRITICAL INSTRUCTION 2: CONTENT SOURCE**
{{#if notes}}
---
You MUST base the generated notes primarily on the following text provided by the user. The topic "{{{topic}}}" provides context, but the content below is the main source of truth.
USER-PROVIDED NOTES:
{{{notes}}}
---
{{/if}}

{{#if image}}
The user has also provided an image for additional context. Use it to enhance the notes where relevant, respecting the language instruction above.
User's Image: {{media url=image}}
{{/if}}
{{#if audio}}
The user has also provided an audio file for additional context. Use it to enhance the notes.
User's Audio: {{media url=audio}}
{{/if}}
{{#if video}}
The user has also provided an audio transcription from a video. This is a primary source of information. Use it to enhance the notes.
Video Transcription: {{{video}}}
{{/if}}

Please generate the study notes with the following characteristics, **always in the detected language**:

1.  **Tone & Structure:**
    *   Start with a brief, exciting introduction.
    *   Use a clear hierarchy of Markdown headings (e.g., # Title, ## Section, ### Sub-section).
    *   Use **bold** for key terms and *italics* for emphasis.
    *   Use \`blockquotes\` for important definitions or facts.
    *   Use lists ('- ' or '1. ') for detailed points.
    *   Use relevant emojis (🚀, ✨, 🤔, 🧠) next to headings to add visual appeal.

2.  **MANDATORY: Visual Placeholders:**
    *   You **MUST** insert visual aid placeholders where a diagram or image would enhance understanding.
    *   Use the exact format: \`[VISUAL_PROMPT: A descriptive prompt for an educational image in English]\`. **The prompt inside the brackets must be in English**, even if the rest of the notes are in another language.
    *   **Examples:** \`[VISUAL_PROMPT: A colorful diagram of the Krebs cycle]\` or \`[VISUAL_PROMPT: A simple chart showing the process of photosynthesis]\`.
    *   Aim for 2-3 visual prompts per document.

3.  **Conclusion:**
    *   End with a concise summary paragraph.

The entire output should be ONLY the notes content as a single Markdown string. Do NOT add any extra text, introductions, or JSON formatting.
`,
  config: { 
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  }
});

const generateStudyNotesFlow = aiForNotes.defineFlow( 
  {
    name: 'generateStudyNotesFlow',
    inputSchema: GenerateStudyNotesInputSchema,
    outputSchema: GenerateStudyNotesOutputSchema,
  },
  async (input) => {
    console.log(`[AI Flow - Notes Text] Generating notes text for topic: ${input.topic}`);
    // The prompt now returns a raw string response for better reliability.
    const llmResponse = await generateStudyNotesPrompt(input);
    const notesText = llmResponse.text;
    
    if (!notesText || notesText.trim() === '') {
      console.error("[AI Flow Error - Notes Text] AI returned empty or invalid notes data.");
      throw new Error("AI failed to generate notes text in the expected style. The returned data was empty or invalid.");
    }
    
    let notesWithPlaceholders = notesText;
    console.log(`[AI Flow - Notes Text] Successfully generated notes text for topic: ${input.topic}. Length: ${notesWithPlaceholders.length}`);

    // Real Image generation step
    const visualPromptRegex = /\[VISUAL_PROMPT:\s*([^\]]+)\]/g;
    let match;
    const visualPrompts: { fullMatch: string, promptText: string }[] = [];

    // First, collect all visual prompts
    while ((match = visualPromptRegex.exec(notesWithPlaceholders)) !== null) {
      visualPrompts.push({ fullMatch: match[0], promptText: match[1].trim() });
    }
    
    console.log(`[AI Flow - Notes Images] Found ${visualPrompts.length} visual prompts to process for image generation:`, visualPrompts.map(vp => vp.promptText));

    if (visualPrompts.length > 0) {
        // Use Promise.allSettled to handle individual image generation failures without crashing the entire flow.
        const imageGenerationPromises = visualPrompts.map(vp => 
            generateImageFromPrompt({ prompt: vp.promptText })
        );
        const settledResults = await Promise.allSettled(imageGenerationPromises);

        let finalNotes = notesWithPlaceholders;
        settledResults.forEach((result, index) => {
            const originalPrompt = visualPrompts[index];
            if (result.status === 'fulfilled' && result.value.imageUrl) {
                console.log(`[AI Flow - Notes Images] Got image URL for: "${originalPrompt.promptText.substring(0,30)}...". Replacing placeholder with image link.`);
                const markdownImage = `![${originalPrompt.promptText.replace(/"/g, "'")}](${result.value.imageUrl})`;
                finalNotes = finalNotes.replace(originalPrompt.fullMatch, markdownImage);
            } else if (result.status === 'rejected') {
                // If a promise was rejected, log the reason and leave the placeholder.
                console.warn(`[AI Flow - Notes Images] Failed to generate image for prompt: "${originalPrompt.promptText}". Reason: ${result.reason}. Placeholder will remain.`);
            } else {
                // This covers cases where the promise fulfilled but didn't return a valid imageUrl.
                console.warn(`[AI Flow - Notes Images] Image generation fulfilled but returned no valid URL for prompt: "${originalPrompt.promptText}". Placeholder will remain.`);
            }
        });
        
        console.log(`[AI Flow - Notes Images] Finished processing all visual prompts. Final notes length: ${finalNotes.length}`);
        return { notes: finalNotes };
    } else {
         console.log(`[AI Flow - Notes Images] No visual prompts found. Returning original notes.`);
         return { notes: notesWithPlaceholders };
    }
  }
);

export async function generateStudyNotes(input: GenerateStudyNotesInput): Promise<GenerateStudyNotesOutput> {
  console.log(`[AI Wrapper] generateStudyNotes called for topic: ${input.topic}. Using notes-specific AI configuration if GOOGLE_API_KEY_NOTES is set.`);
  try {
    return await generateStudyNotesFlow(input);
  } catch (error: any) {
    console.error("[AI Wrapper Error - generateStudyNotes] Error in flow execution:", error.message, error.stack);
    let clientErrorMessage = "Failed to generate study notes. Please try again.";
    const lowerCaseError = error.message?.toLowerCase() || "";

    if (lowerCaseError.includes("model not found") || lowerCaseError.includes("permission denied") || lowerCaseError.includes("api key not valid")) {
      clientErrorMessage = "Study Notes: Generation failed due to an API key or project configuration issue. Please check that the GOOGLE_API_KEY_NOTES (or its fallback) is correct and that the 'Generative Language API' is enabled with billing in its Google Cloud project.";
    } else if (lowerCaseError.includes("api key") || lowerCaseError.includes("google_api_key")) {
       clientErrorMessage = "Study Notes: Generation failed due to an API key issue. Please check server configuration (GOOGLE_API_KEY, GOOGLE_API_KEY_NOTES, or GOOGLE_API_KEY_IMAGES) and ensure billing is enabled for the Google Cloud project.";
    } else if (error.message) {
      clientErrorMessage = `Study Notes: Generation failed. Error: ${error.message.substring(0, 150)}. Check server logs for full details.`;
    }
    throw new Error(clientErrorMessage);
  }
}
