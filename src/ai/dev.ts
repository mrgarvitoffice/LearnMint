
/**
 * @file Genkit development server entry point.
 * This file is used to start the Genkit development server, which provides a UI for
 * testing and debugging AI flows. It loads environment variables and imports all flow
 * definitions to make them discoverable by the Genkit tools.
 */
import { config } from 'dotenv';
config(); // Load .env variables

import './genkit'; // Ensures genkit is configured via genkit() call

// Import all your flows here so the Genkit dev UI can discover them
import '@/ai/flows/generate-study-notes';
import '@/ai/flows/generate-quiz-questions';
import '@/ai/flows/generate-flashcards';
import '@/ai/flows/ai-chatbot'; 
import '@/ai/flows/helper-ai-chatbot';
import '@/ai/flows/coder-ai-chatbot';
import '@/ai/flows/generate-quiz-from-notes';
import '@/ai/flows/generate-flashcards-from-notes';
import '@/ai/flows/search-youtube-videos';
import '@/ai/flows/search-google-books';
import '@/ai/flows/generate-image-from-prompt';
import '@/ai/flows/generate-audio-flashcards';
import '@/ai/flows/generate-audio-summary';
import '@/ai/flows/generate-discussion-audio';
import '@/ai/flows/generate-math-fact';
import '@/ai/flows/generate-college-notes';
import '@/ai/flows/jarvis-command';
import '@/ai/flows/prototyper-flow';
import '@/ai/flows/generate-subject-summary';
import '@/ai/flows/generate-top-questions';
