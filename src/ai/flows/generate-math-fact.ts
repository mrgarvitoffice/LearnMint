
'use server';
/**
 * @fileOverview A Genkit flow to translate a given math fact into a target language.
 *
 * - generateTranslatedMathFact - A function that takes a fact and a language, returning the translation.
 * - TranslateMathFactInput - The input type for this function.
 * - TranslateMathFactOutput - The return type for this function.
 */

import { aiForNotes } from '@/ai/genkit';
import { z } from 'zod';

// Note: The function names in this file are kept similar to the original for compatibility,
// but the functionality has been changed from 'generation' to 'translation' for reliability.

const TranslateMathFactInputSchema = z.object({
  factToTranslate: z.string().describe('The English math fact to be translated.'),
  targetLanguageName: z.string().describe('The target language for the translation (e.g., "Spanish", "Japanese").'),
});
export type TranslateMathFactInput = z.infer<typeof TranslateMathFactInputSchema>;

const TranslateMathFactOutputSchema = z.object({
  fact: z.string().describe('The math fact, translated into the target language.'),
});
export type TranslateMathFactOutput = z.infer<typeof TranslateMathFactOutputSchema>;


const translateMathFactPrompt = aiForNotes.definePrompt({
    name: 'translateMathFactPrompt',
    model: 'googleai/gemini-1.5-flash-latest',
    input: { schema: TranslateMathFactInputSchema },
    output: { schema: TranslateMathFactOutputSchema },
    prompt: `You are a highly skilled linguist and translator. Your task is to perform a single, precise translation.
You will be given a fact in English and a target language.
You MUST translate the English fact into the specified target language.

**CRITICAL INSTRUCTIONS:**
1.  Your entire response MUST be **ONLY** the translated fact.
2.  Do NOT add any extra words, phrases, explanations, or conversational text like "Here is the translation:".
3.  The final output must be a valid JSON object as per the schema, containing only the translated string.

---
English Fact to Translate:
"{{{factToTranslate}}}"
---
Translate the above fact into this Target Language:
"{{{targetLanguageName}}}"
---

Your translated fact:`,
    config: {
        temperature: 0.2, // Lower temperature for more deterministic translation
    },
});

const translateMathFactFlow = aiForNotes.defineFlow(
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
