'use server';
/**
 * @fileOverview A Genkit flow to translate a given math fact into a target language.
 *
 * - generateTranslatedMathFact - A function that takes a fact and a language, returning the translation.
 * - TranslateMathFactInput - The input type for this function.
 * - TranslateMathFactOutput - The return type for this function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Note: The function names in this file are kept similar to the original for compatibility,
// but the functionality has been changed from 'generation' to 'translation' for reliability.

const TranslateMathFactInputSchema = z.object({
  factToTranslate: z.string().describe('The English math fact to be translated.'),
  targetLanguageName: z.string().describe('The target language for the translation (e.g., "Español", "日本語").'),
});
export type TranslateMathFactInput = z.infer<typeof TranslateMathFactInputSchema>;

const TranslateMathFactOutputSchema = z.object({
  fact: z.string().describe('The math fact, translated into the target language.'),
});
export type TranslateMathFactOutput = z.infer<typeof TranslateMathFactOutputSchema>;


const translateMathFactPrompt = ai.definePrompt({
    name: 'translateMathFactPrompt',
    model: 'googleai/gemini-1.5-flash-latest',
    input: { schema: TranslateMathFactInputSchema },
    output: { schema: TranslateMathFactOutputSchema },
    prompt: `You are an expert multilingual translator. Your only task is to translate the given English fact into the specified target language. Respond ONLY with the translated text. Do not add any extra text, introductions, or conversational filler.

English Fact: "{{{factToTranslate}}}"
Target Language: {{{targetLanguageName}}}
`,
    config: {
        temperature: 0.2, // Lower temperature for more deterministic translation
    },
});

const translateMathFactFlow = ai.defineFlow(
  {
    name: 'generateMathFactFlow', // Keep original name to avoid breaking dev server import
    inputSchema: TranslateMathFactInputSchema,
    outputSchema: TranslateMathFactOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await translateMathFactPrompt(input);
      if (!output || !output.fact || output.fact.trim() === '') {
          console.error(`[AI Flow Error - Translate Math Fact] AI returned an empty or invalid translation for language "${input.targetLanguageName}".`);
          // Fallback to English if translation fails
          return { fact: input.factToTranslate };
      }
      return output;
    } catch(e) {
        console.error(`[AI Flow Error - Translate Math Fact] Failed for language "${input.targetLanguageName}":`, e);
        // If the entire flow fails, fall back to the original English fact to ensure something is always displayed.
        return { fact: input.factToTranslate };
    }
  }
);

/**
 * Wrapper function to be called from server actions.
 * This is now a translation function.
 * @param {TranslateMathFactInput} input - The fact and target language.
 * @returns {Promise<TranslateMathFactOutput>} The translated math fact.
 */
export async function generateTranslatedMathFact(input: TranslateMathFactInput): Promise<TranslateMathFactOutput> {
  return translateMathFactFlow(input);
}
