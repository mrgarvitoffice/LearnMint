
"use server";
import type { MathFact } from './types';
import { MATH_FACTS_FALLBACK } from './constants';
import { getTranslatedMathFact } from './actions/fact-actions';

/**
 * @deprecated This function is deprecated and will be removed in a future version.
 * Use getTranslatedMathFact from 'lib/actions/fact-actions' instead.
 */
export async function fetchMathFact(): Promise<MathFact> {
  console.warn("DEPRECATED: fetchMathFact is deprecated. Use getTranslatedMathFact instead.");
  try {
    // Call the new, correct function with a default language
    const fact = await getTranslatedMathFact('en');
    return fact;
  } catch (error) {
    console.warn("Failed to fetch live math fact, using fallback:", error);
    // Return a random fallback fact
    const randomIndex = Math.floor(Math.random() * MATH_FACTS_FALLBACK.length);
    return { text: MATH_FACTS_FALLBACK[randomIndex] };
  }
}
