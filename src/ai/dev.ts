/**
 * LearnMint: Your AI-Powered Learning Assistant
 * @author MrGarvit
 * 
 * This file is the entry point for the Genkit development server.
 * It loads environment variables and imports all AI flow definitions
 * so they can be discovered and tested in the Genkit Developer UI.
 */
import { config } from 'dotenv';
config(); // Load .env variables

import './genkit'; // Ensures genkit is configured via genkit() call

// Import all your flows here so the Genkit dev UI can discover them
import '@/ai/flows/generate-study-notes';
import '@/ai/flows/generate-quiz-questions';
import '@/ai/flows/generate-flashcards';
import '@/ai/flows/ai-chatbot'; 
import '@/ai/flows/holo-chatbot';
import '@/ai/flows/megumin-chatbot';
import '@/ai/flows/generate-quiz-from-notes';
import '@/ai/flows/generate-flashcards-from-notes';
import '@/ai/flows/search-youtube-videos';
import '@/ai/flows/search-google-books';
import '@/ai/flows/generate-image-from-prompt';
import '@/ai/flows/generate-audio-flashcards';
import '@/ai/flows/generate-audio-summary';
import '@/ai/flows/generate-discussion-audio';
import '@/ai/flows/generate-math-fact';
