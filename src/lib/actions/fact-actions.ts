
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
  // Find the full language label (e.g., "Español (Spanish)") and extract just the primary name.
  let languageName = APP_LANGUAGES.find(lang => lang.value === languageCode)?.label || "English";
  languageName = languageName.split('(')[0].trim(); // Converts "Español (Spanish)" to "Español" for a cleaner prompt.

  try {
    console.log(`[Action - Math Fact] Requesting fact for language: ${languageName} (code: ${languageCode})`);
    const result = await generateTranslatedMathFact({ languageName: languageName });
    if (!result || !result.fact) {
      throw new Error("AI did not return a valid math fact.");
    }
    console.log(`[Action - Math Fact] Successfully received fact in ${languageName}: "${result.fact.substring(0, 50)}..."`);
    return { fact: result.fact };
  } catch (error) {
    console.error(`[Action Error - Math Fact] Failed for language "${languageName}":`, error);
    // Re-throw the error to be handled by the calling component's query error state.
    throw new Error(`Failed to generate a math fact in ${languageName}. Please try again.`);
  }
}
