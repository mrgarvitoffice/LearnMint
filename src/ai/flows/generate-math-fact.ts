
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
    prompt: `You are a helpful assistant that provides interesting, concise facts about mathematics.
    Your task is to generate ONE interesting math fact suitable for a general audience.
    The fact MUST be written in the following language: {{{languageName}}}.
    
    Do not add any extra text, introductions, or conversational filler. Output only the fact itself.
    
    Example for "Español": "El número 0 es el único número que no se puede representar con números romanos."
    Example for "English": "A 'googol' is the number 1 followed by 100 zeros."
    `,
});

const generateMathFactFlow = ai.defineFlow(
  {
    name: 'generateMathFactFlow',
    inputSchema: GenerateMathFactInputSchema,
    outputSchema: GenerateMathFactOutputSchema,
  },
  async (input) => {
    const { output } = await generateMathFactPrompt(input);
    if (!output || !output.fact) {
        throw new Error("AI failed to generate a math fact.");
    }
    return output;
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
