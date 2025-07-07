
'use server';
/**
 * LearnMint: Your AI-Powered Learning Assistant
 * @author MrGarvit
 * @fileOverview Server action for fetching a translated math fact.
 */

import { generateTranslatedMathFact } from '@/ai/flows/generate-math-fact';
import { APP_LANGUAGES } from '@/lib/constants';
import type { MathFact } from '@/lib/types';

/**
 * Gets an interesting math fact from the AI, translated into the specified language.
 * 
 * @param {string} languageCode - The two-letter language code (e.g., "en", "es").
 * @returns {Promise<MathFact>} A promise that resolves to the translated math fact.
 * @throws Will throw an error if the AI operation fails.
 */
export async function getTranslatedMathFact(languageCode: string): Promise<MathFact> {
  const language = APP_LANGUAGES.find(lang => lang.value === languageCode)?.label || "English";

  try {
    const result = await generateTranslatedMathFact({ languageName: language });
    if (!result || !result.fact) {
      throw new Error("AI did not return a valid math fact.");
    }
    return { text: result.fact };
  } catch (error) {
    console.error(`Error generating translated math fact for language "${language}":`, error);
    // Re-throw the error to be handled by the calling component's query error state.
    throw new Error(`Failed to generate a math fact in ${language}. Please try again.`);
  }
}
