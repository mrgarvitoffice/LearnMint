
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
    prompt: `You are an expert multilingual assistant that provides interesting, concise facts about mathematics.
Your task is to generate ONE interesting math fact suitable for a general audience.
The fact MUST be written in the following language: {{{languageName}}}. This is a strict requirement.

CRITICAL INSTRUCTIONS:
1.  Analyze the language name "{{{languageName}}}" and provide the fact ONLY in that language.
2.  Do NOT add any extra text, introductions, or conversational filler. Output only the single fact itself.
3.  The fact should be a complete sentence.

Example for "Español": "El número 0 es el único número que no se puede representar con números romanos."
Example for "English": "There are more possible games of chess than atoms in the observable universe."
Example for "हिन्दी": "शून्य एकमात्र ऐसी संख्या है जिसे रोमन अंकों द्वारा दर्शाया नहीं जा सकता है।"
    `,
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