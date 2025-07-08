
'use server';
/**
 * @fileOverview A Genkit flow to generate a random math fact in a specified language.
 *
 * - generateTranslatedMathFact - A function that takes a language name and returns a math fact in that language.
 * - GenerateMathFactInput - The input type for this function.
 * - GenerateMathFactOutput - The return type for this function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateMathFactInputSchema = z.object({
  languageName: z.string().describe('The language in which to generate the math fact (e.g., "English", "Español").'),
});
export type GenerateMathFactInput = z.infer<typeof GenerateMathFactInputSchema>;

const GenerateMathFactOutputSchema = z.object({
  fact: z.string().describe('A single, interesting math fact translated into the requested language.'),
});
export type GenerateMathFactOutput = z.infer<typeof GenerateMathFactOutputSchema>;


const generateMathFactPrompt = ai.definePrompt({
    name: 'generateMathFactPrompt',
    model: 'googleai/gemini-1.5-flash-latest',
    input: { schema: GenerateMathFactInputSchema },
    output: { schema: GenerateMathFactOutputSchema },
    prompt: `You are a multilingual mathematics expert.
Your one and only task is to generate a single, interesting math fact.

CRITICAL: The fact MUST be written in the language named "{{{languageName}}}". Do not use any other language.
The fact should be a complete sentence, suitable for a general audience.

IMPORTANT: Do NOT add any extra text, introductions, or conversational filler. Your entire response must be ONLY the single fact itself.
`,
    config: {
        temperature: 0.9,
    },
});

const generateMathFactFlow = ai.defineFlow(
  {
    name: 'generateMathFactFlow',
    inputSchema: GenerateMathFactInputSchema,
    outputSchema: GenerateMathFactOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await generateMathFactPrompt(input);
      if (!output || !output.fact || output.fact.trim() === '') {
          console.error(`[AI Flow Error - Math Fact] AI returned an empty or invalid fact for language "${input.languageName}".`);
          throw new Error("AI returned an empty or invalid fact.");
      }
      return output;
    } catch(e) {
        console.error(`[AI Flow Error - Math Fact] Failed for language "${input.languageName}":`, e);
        // Do not return a default fact here; let the caller handle the error.
        // This ensures the client knows the operation failed and can display an error state.
        throw new Error(`The AI failed to generate a math fact in ${input.languageName}.`);
    }
  }
);

/**
 * Wrapper function to be called from server actions.
 * @param {GenerateMathFactInput} input - The language name for the fact.
 * @returns {Promise<GenerateMathFactOutput>} The generated math fact.
 */
export async function generateTranslatedMathFact(input: GenerateMathFactInput): Promise<GenerateMathFactOutput> {
  return generateMathFactFlow(input);
}
