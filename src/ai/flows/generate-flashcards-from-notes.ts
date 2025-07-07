/**
 * LearnMint: Your AI-Powered Learning Assistant
 * @author MrGarvit
 * @fileOverview An AI agent that creates flashcards based on provided notes.
 *
 * - generateFlashcardsFromNotes - Handles flashcard generation from notes.
 * - GenerateFlashcardsFromNotesInput - Input type for the generation function.
 * - GenerateFlashcardsOutput - Return type (shared with generate-flashcards.ts).
 */

'use server';

import {aiForQuizzes} from '@/ai/genkit';
import {z} from 'zod';
import type { GenerateFlashcardsOutput } from './generate-flashcards'; // Reuse existing output type

// Define GenerateFlashcardsOutputSchema locally for this flow's prompt
const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z
    .array(
      z.object({
        term: z.string().describe('The term to be defined.'),
        definition: z.string().describe('The definition of the term.'),
      })
    )
    .describe('An array of flashcards, each with a term and its definition.'),
});

const GenerateFlashcardsFromNotesInputSchema = z.object({
  notesContent: z.string().describe('The study notes content in markdown format to base the flashcards on.'),
  numFlashcards: z.number().min(1).max(50).describe('The number of flashcards to generate.'),
});
export type GenerateFlashcardsFromNotesInput = z.infer<typeof GenerateFlashcardsFromNotesInputSchema>;

export async function generateFlashcardsFromNotes(input: GenerateFlashcardsFromNotesInput): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFromNotesFlow(input);
}

const prompt = aiForQuizzes.definePrompt({
  name: 'generateFlashcardsFromNotesPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GenerateFlashcardsFromNotesInputSchema},
  output: {schema: GenerateFlashcardsOutputSchema},
  prompt: `You are an expert multilingual educator specializing in creating flashcards. Your task is to generate {{numFlashcards}} flashcards based *solely* on the provided study notes.

**CRUCIAL INSTRUCTION:** First, determine the primary language of the provided "Study Notes Content". You **MUST** write all 'term' and 'definition' fields in that same language. Do not default to English if the notes are in another language.

Study Notes Content:
---
{{{notesContent}}}
---

Please ensure all terms and definitions are derived directly from the information within the provided notes. Do not use any external knowledge.
The flashcards should cover the most important aspects of the notes.

Format the output as a JSON array of objects, where each object has a 'term' and a 'definition' field.
Example schema for output:
\n{{{outputSchema}}}
`,
});

const generateFlashcardsFromNotesFlow = aiForQuizzes.defineFlow(
  {
    name: 'generateFlashcardsFromNotesFlow',
    inputSchema: GenerateFlashcardsFromNotesInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.flashcards || !Array.isArray(output.flashcards)) {
      console.error("[AI Flow Error - Flashcards From Notes] AI returned empty or invalid data:", output);
      return { flashcards: [] };
    }
    return output;
  }
);
