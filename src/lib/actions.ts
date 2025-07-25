
'use server';
/**
 * @fileoverview Defines the primary server actions for the application.
 * Server actions are asynchronous functions that run on the server and can be called directly from client components.
 * They are used for data mutations, AI model interactions, and other server-side logic, providing a secure
 * way to interact with server resources without needing to create separate API endpoints.
 * @see https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
 */

import { generateStudyNotes, type GenerateStudyNotesInput, type GenerateStudyNotesOutput } from "@/ai/flows/generate-study-notes";
import { generateQuizQuestions, type GenerateQuizQuestionsInput, type GenerateQuizQuestionsOutput } from "@/ai/flows/generate-quiz-questions";
import { generateFlashcards, type GenerateFlashcardsInput, type GenerateFlashcardsOutput } from "@/ai/flows/generate-flashcards";
import { generateAudioFlashcards, type GenerateAudioFlashcardsInput, type GenerateAudioFlashcardsOutput } from "@/ai/flows/generate-audio-flashcards";
import { generateAudioSummary, type GenerateAudioSummaryInput } from "@/ai/flows/generate-audio-summary";
import { generateDiscussionAudio, type GenerateDiscussionAudioInput, type GenerateDiscussionAudioOutput } from "@/ai/flows/generate-discussion-audio";
import { generateQuizFromNotes, type GenerateQuizFromNotesInput } from "@/ai/flows/generate-quiz-from-notes";
import { generateFlashcardsFromNotes, type GenerateFlashcardsFromNotesInput } from "@/ai/flows/generate-flashcards-from-notes";
import { getTotalUsers } from './actions/stats';


import type { YoutubeSearchInput, YoutubeSearchOutput, YoutubeVideoItem, GoogleBooksSearchInput, GoogleBooksSearchOutput, GoogleBookItem, GenerateAudioSummaryOutput as ClientGenerateAudioSummaryOutput } from './types';

/**
 * @interface CombinedStudyMaterialsOutput
 * Defines the structure for the combined output when generating all study materials.
 * It includes the notes, optionally quiz and flashcards, and any errors encountered during their generation.
 */
export interface CombinedStudyMaterialsOutput {
  notesOutput: GenerateStudyNotesOutput;
  notesError?: string; // Add notesError field
  quizOutput?: GenerateQuizQuestionsOutput;
  flashcardsOutput?: GenerateFlashcardsOutput;
  quizError?: string;
  flashcardsError?: string;
}

/**
 * generateNotesAction (Combined Material Generation)
 *
 * This server action orchestrates the generation of study notes, a 30-question quiz,
 * and 20 flashcards based on a single topic input. It can also accept user-provided notes
 * as a primary source.
 *
 * @param input - Contains the topic string, and optional image or notes content.
 * @returns A promise that resolves to an object containing the generated materials and any errors.
 * @throws Error if the primary notes generation fails or input.topic is not a string.
 */
export async function generateNotesAction(input: GenerateStudyNotesInput): Promise<CombinedStudyMaterialsOutput> {
  const actionName = "generateNotesAction (combined)";
  console.log(`[Server Action] ${actionName} called for topic: ${input.topic}`);

  if (typeof input.topic !== 'string') {
    const errorMsg = `[Server Action - ${actionName}] Critical error: Topic must be a string. Received type: ${typeof input.topic}, value: ${input.topic}`;
    console.error(`[Server Action Error - ${actionName}] Topic is not a string, received:`, input.topic);
    throw new Error(errorMsg);
  }
  const trimmedTopic = input.topic.trim();

  let notesResult: GenerateStudyNotesOutput | undefined;
  let notesGenError: string | undefined;

  try {
    // Primary step: Generate study notes. This includes AI image generation.
    notesResult = await generateStudyNotes({
      topic: trimmedTopic,
      image: input.image,
      notes: input.notes,
      audio: input.audio,
      video: input.video
    });
    if (!notesResult || !notesResult.notes) {
      throw new Error("AI returned empty or invalid notes data.");
    }
  } catch (error: any) {
    console.error(`[Server Action Error - ${actionName} - Notes Gen] Error generating notes:`, error);
    let clientErrorMessage = "Failed to generate study notes. This is the primary step and it failed.";
    if (error.message && (error.message.includes("GOOGLE_API_KEY") || error.message.includes("API key is invalid") || error.message.includes("API_KEY_INVALID"))) {
      clientErrorMessage = "Study Notes: Generation failed due to an API key issue (primary step). Check server configuration (GOOGLE_API_KEY, GOOGLE_API_KEY_NOTES, or GOOGLE_API_KEY_IMAGES).";
    } else if (error.message) {
      clientErrorMessage = `Study Notes: Generation failed (primary step). Error: ${error.message.substring(0, 150)}. Check server logs for full details.`;
    }
    notesGenError = clientErrorMessage;
  }
  
  if (!notesResult?.notes) {
     return {
        notesOutput: { notes: "" },
        notesError: notesGenError || "Primary notes generation failed to produce content.",
        quizError: "Skipped due to notes failure.",
        flashcardsError: "Skipped due to notes failure.",
    };
  }

  // Notes generated successfully, now generate quiz and flashcards FROM THE NOTES.
  const quizInput: GenerateQuizFromNotesInput = { notesContent: notesResult.notes, numQuestions: 30 };
  const flashcardsInput: GenerateFlashcardsFromNotesInput = { notesContent: notesResult.notes, numFlashcards: 20 };

  let quizData: GenerateQuizQuestionsOutput | undefined;
  let flashcardsData: GenerateFlashcardsOutput | undefined;
  let quizGenError: string | undefined;
  let flashcardsGenError: string | undefined;

  console.log(`[Server Action - ${actionName}] Attempting to generate quiz and flashcards from generated notes for topic: ${trimmedTopic}`);

  const results = await Promise.allSettled([
    generateQuizFromNotes(quizInput),
    generateFlashcardsFromNotes(flashcardsInput)
  ]);

  const quizResultOutcome = results[0];
  if (quizResultOutcome.status === 'fulfilled') {
    if (quizResultOutcome.value?.questions?.length > 0) {
      quizData = quizResultOutcome.value;
      console.log(`[Server Action - ${actionName}] Quiz generated successfully from notes.`);
    } else {
      quizGenError = "AI returned no quiz questions or invalid quiz data from notes.";
      console.warn(`[Server Action - ${actionName}] Quiz generation from notes for topic "${trimmedTopic}" resulted in empty/invalid data.`);
    }
  } else {
    console.error(`[Server Action Error - ${actionName} - Quiz Gen] Error generating quiz from notes:`, quizResultOutcome.reason);
    quizGenError = quizResultOutcome.reason?.message?.substring(0, 150) || "Failed to generate quiz questions from notes.";
  }

  const flashcardsResultOutcome = results[1];
  if (flashcardsResultOutcome.status === 'fulfilled') {
     if (flashcardsResultOutcome.value?.flashcards?.length > 0) {
      flashcardsData = flashcardsResultOutcome.value;
      console.log(`[Server Action - ${actionName}] Flashcards generated successfully from notes.`);
    } else {
      flashcardsGenError = "AI returned no flashcards or invalid flashcard data from notes.";
      console.warn(`[Server Action - ${actionName}] Flashcard generation from notes for topic "${trimmedTopic}" resulted in empty/invalid data.`);
    }
  } else {
    console.error(`[Server Action Error - ${actionName} - Flashcard Gen] Error generating flashcards from notes:`, flashcardsResultOutcome.reason);
    flashcardsGenError = flashcardsResultOutcome.reason?.message?.substring(0, 150) || "Failed to generate flashcards from notes.";
  }

  return {
    notesOutput: notesResult,
    quizOutput: quizData,
    flashcardsOutput: flashcardsData,
    quizError: quizGenError,
    flashcardsError: flashcardsGenError,
  };
}

/**
 * generateQuizAction (Standalone Quiz Generation)
 *
 * This server action is used for generating quizzes independently, typically from the dedicated Quiz page.
 *
 * @param input - Contains the topic, number of questions, and difficulty for the quiz.
 * @returns A promise that resolves to the generated quiz questions.
 * @throws Error if quiz generation fails or input.topic is not a string.
 */
export async function generateQuizAction(input: GenerateQuizQuestionsInput): Promise<GenerateQuizQuestionsOutput> {
  const actionName = "generateQuizAction (standalone)";
  console.log(`[Server Action] ${actionName} called for topic: ${input.topic}, numQuestions: ${input.numQuestions}, difficulty: ${input.difficulty}`);

  if (typeof input.topic !== 'string') {
    console.error(`[Server Action Error - ${actionName}] Topic is not a string, received:`, input.topic);
    throw new Error(`[Server Action - ${actionName}] Critical error: Topic must be a string. Received type: ${typeof input.topic}, value: ${input.topic}`);
  }
  const trimmedTopic = input.topic.trim();

  try {
    let result;
    if (input.notes) {
      // Use the dedicated flow if notes are provided
      result = await generateQuizFromNotes({
        notesContent: input.notes,
        numQuestions: input.numQuestions,
      });
    } else {
      result = await generateQuizQuestions({ ...input, topic: trimmedTopic });
    }

    if (!result || !result.questions || result.questions.length === 0) {
      throw new Error("AI returned empty or invalid quiz data.");
    }
    return result;
  } catch (error: any) {
    console.error(`[Server Action Error - ${actionName}] Error generating quiz:`, error);
    let clientErrorMessage = "Failed to generate quiz. Please try again.";
     if (error.message && (error.message.includes("GOOGLE_API_KEY") || error.message.includes("API key is invalid") || error.message.includes("API_KEY_INVALID"))) {
      clientErrorMessage = "Quiz Generation: Failed due to an API key or project configuration issue. Please check server configuration.";
    } else if (error.message) {
      clientErrorMessage = `Quiz Generation: Failed. Error: ${error.message.substring(0, 150)}. Check server logs for full details.`;
    }
    throw new Error(clientErrorMessage);
  }
}

/**
 * generateFlashcardsAction (Standalone Flashcard Generation)
 *
 * This server action is used for generating flashcards independently, typically from the dedicated Flashcards page.
 *
 * @param input - Contains the topic and number of flashcards.
 * @returns A promise that resolves to the generated flashcards.
 * @throws Error if flashcard generation fails or input.topic is not a string.
 */
export async function generateFlashcardsAction(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  const actionName = "generateFlashcardsAction (standalone)";
  console.log(`[Server Action] ${actionName} called for topic: ${input.topic}, numFlashcards: ${input.numFlashcards}`);

  if (typeof input.topic !== 'string') {
    console.error(`[Server Action Error - ${actionName}] Topic is not a string, received:`, input.topic);
    throw new Error(`[Server Action - ${actionName}] Critical error: Topic must be a string. Received type: ${typeof input.topic}, value: ${input.topic}`);
  }
  const trimmedTopic = input.topic.trim();

  try {
    const result = await generateFlashcards({ ...input, topic: trimmedTopic });
     if (!result || !result.flashcards || result.flashcards.length === 0) {
      throw new Error("AI returned empty or invalid flashcard data.");
    }
    return result;
  } catch (error: any) {
    console.error(`[Server Action Error - ${actionName}] Error generating flashcards:`, error);
    let clientErrorMessage = "Failed to generate flashcards. Please try again.";
    if (error.message && (error.message.includes("GOOGLE_API_KEY") || error.message.includes("API key is invalid") || error.message.includes("API_KEY_INVALID"))) {
      clientErrorMessage = "Flashcard Generation: Failed due to an API key issue. Please check server configuration.";
    } else if (error.message) {
      clientErrorMessage = `Flashcard Generation: Failed. Error: ${error.message.substring(0, 150)}. Check server logs for full details.`;
    }
    throw new Error(clientErrorMessage);
  }
}

/**
 * generateAudioFlashcardsAction (Standalone Audio Flashcard Generation)
 * NOTE: This action now only generates text. Audio is handled client-side.
 * @param input - Contains the topic and number of flashcards.
 * @returns A promise that resolves to the generated flashcards (text only).
 * @throws Error if flashcard generation fails or input.topic is not a string.
 */
export async function generateAudioFlashcardsAction(input: GenerateAudioFlashcardsInput): Promise<GenerateAudioFlashcardsOutput> {
  const actionName = "generateAudioFlashcardsAction";
  console.log(`[Server Action] ${actionName} called for topic: ${input.topic}, numFlashcards: ${input.numFlashcards}`);

  if (typeof input.topic !== 'string') {
    console.error(`[Server Action Error - ${actionName}] Topic is not a string, received:`, input.topic);
    throw new Error(`[Server Action - ${actionName}] Critical error: Topic must be a string. Received type: ${typeof input.topic}, value: ${input.topic}`);
  }
  const trimmedTopic = input.topic.trim();

  try {
    const result = await generateAudioFlashcards({ ...input, topic: trimmedTopic });
     if (!result || !result.flashcards || result.flashcards.length === 0) {
      throw new Error("AI returned empty or invalid flashcard data.");
    }
    return result;
  } catch (error: any) {
    console.error(`[Server Action Error - ${actionName}] Error generating audio flashcards:`, error);
    let clientErrorMessage = "Failed to generate audio flashcards. Please try again.";
    if (error.message && (error.message.includes("GOOGLE_API_KEY") || error.message.includes("API key is invalid") || error.message.includes("API_KEY_INVALID"))) {
      clientErrorMessage = "Audio Flashcard Generation: Failed due to an API key or configuration issue. Please check server configuration.";
    } else if (error.message) {
      clientErrorMessage = `Audio Flashcard Generation: Failed. Error: ${error.message.substring(0, 150)}. Check server logs for full details.`;
    }
    throw new Error(clientErrorMessage);
  }
}

/**
 * generateAudioSummaryAction
 *
 * This server action takes text OR an image and generates a text summary.
 * The audio part is now handled client-side via Web Speech API.
 *
 * @param input - Contains optional text and/or an image data URI.
 * @returns A promise that resolves to the summary text.
 * @throws Error if generation fails.
 */
export async function generateAudioSummaryAction(input: GenerateAudioSummaryInput): Promise<ClientGenerateAudioSummaryOutput> {
  const actionName = "generateAudioSummaryAction";
  console.log(`[Server Action] ${actionName} called with: ${input.text ? 'text input' : 'image input'}`);

  try {
    const result = await generateAudioSummary(input);
    if (!result || !result.summary) {
      throw new Error("AI returned empty or invalid audio summary data.");
    }
    // Note: We only return the summary text now. The audioDataUri is deprecated on the server.
    return { summary: result.summary, audioDataUri: undefined }; 
  } catch (error: any) {
    console.error(`[Server Action Error - ${actionName}] Error generating audio summary:`, error);
    let clientErrorMessage = "Failed to generate audio summary. Please try again.";
    if (error.message && (error.message.includes("GOOGLE_API_KEY") || error.message.includes("API key is invalid"))) {
        clientErrorMessage = "Audio Summary: Failed due to an API key or configuration issue. Please check the GOOGLE_API_KEY_NOTES (for text) or GOOGLE_API_KEY_TTS (for vision) keys.";
    } else if (error.message) {
        clientErrorMessage = `Audio Summary: Failed. Error: ${error.message.substring(0, 150)}.`;
    }
    throw new Error(clientErrorMessage);
  }
}

/**
 * generateDiscussionAudioAction
 *
 * This server action takes text content and generates a multi-speaker audio discussion.
 *
 * @param input - Contains the text content to be converted.
 * @returns A promise that resolves to the audio data URI.
 * @throws Error if generation fails.
 */
export async function generateDiscussionAudioAction(input: GenerateDiscussionAudioInput): Promise<GenerateDiscussionAudioOutput> {
  const actionName = "generateDiscussionAudioAction";
  console.log(`[Server Action] ${actionName} called.`);

  try {
    const result = await generateDiscussionAudio(input);
    if (!result || !result.audioDataUri) {
      throw new Error("AI failed to generate discussion audio.");
    }
    return result;
  } catch (error: any) {
    console.error(`[Server Action Error - ${actionName}] Error generating discussion audio:`, error);
    let clientErrorMessage = "Failed to generate discussion audio. Please try again.";
    if (error.message) {
        if (error.message.includes("API key") || error.message.includes("permission denied")) {
          clientErrorMessage = "Discussion Audio: API key issue. Check that GOOGLE_API_KEY_NOTES (for text generation) and GOOGLE_API_KEY_TTS (for audio) are correctly configured and have the necessary permissions.";
        } else if (error.message.includes("Invalid format from LLM")) {
          clientErrorMessage = "Discussion Audio: The AI failed to generate a valid script. This can happen with very complex or unusual content. Please try again.";
        } else if (error.message.toLowerCase().includes("model not found") || error.message.includes("access")) {
           clientErrorMessage = "Discussion Audio: The AI model could not be accessed. This is likely a permissions issue with your API key. Please ensure the project associated with GOOGLE_API_KEY_NOTES (or its fallback, GOOGLE_API_KEY) has the 'Generative Language API' enabled.";
        } else {
          clientErrorMessage = `Discussion Audio: ${error.message}`;
        }
    }
    throw new Error(clientErrorMessage);
  }
}

/**
 * fetchStudyNotesAction
 *
 * This server action specifically fetches study notes. Used by the Study Hub page
 * to load/refresh notes independently.
 *
 * @param input - Contains the topic string for which notes are to be generated.
 * @returns A promise that resolves to the generated study notes.
 * @throws Error if notes generation fails or input.topic is not a string.
 */
export async function fetchStudyNotesAction(input: GenerateStudyNotesInput): Promise<GenerateStudyNotesOutput> {
  const actionName = "fetchStudyNotesAction";
  console.log(`[Server Action] ${actionName} called for topic: ${input.topic}`);

  if (typeof input.topic !== 'string') {
    console.error(`[Server Action Error - ${actionName}] Topic is not a string, received:`, input.topic);
    throw new Error(`[Server Action - ${actionName}] Critical error: Topic must be a string. Received type: ${typeof input.topic}, value: ${input.topic}`);
  }
  const trimmedTopic = input.topic.trim();

  try {
    const notesResult = await generateStudyNotes({ topic: trimmedTopic, image: input.image, notes: input.notes });
    if (!notesResult || !notesResult.notes) {
      throw new Error("AI returned empty or invalid notes data for fetchStudyNotesAction.");
    }
    return notesResult;
  } catch (error: any) {
    console.error(`[Server Action Error - ${actionName}] Error fetching notes:`, error);
    let clientErrorMessage = "Failed to fetch study notes.";
    if (error.message && (error.message.includes("GOOGLE_API_KEY") || error.message.includes("API key is invalid") || error.message.includes("API_KEY_INVALID"))) {
      clientErrorMessage = "Study Notes Fetch: Failed due to an API key issue. Check server configuration (GOOGLE_API_KEY, GOOGLE_API_KEY_NOTES, or GOOGLE_API_KEY_IMAGES).";
    } else if (error.message) {
      clientErrorMessage = `Study Notes Fetch: Failed. Error: ${error.message.substring(0, 150)}. Check server logs for full details.`;
    }
    throw new Error(clientErrorMessage);
  }
}


// --- Direct API Search Actions (for Library feature) ---

/**
 * directYoutubeSearch
 *
 * Performs a direct search on the YouTube Data API v3.
 * This is used by the Library page to fetch videos without involving a Genkit flow for this specific search.
 *
 * @param input - Contains the search query and maximum number of results.
 * @returns A promise that resolves to a list of YouTube video items.
 * @throws Error if the YOUTUBE_API_KEY is not configured or if the API request fails.
 */
export async function directYoutubeSearch(input: YoutubeSearchInput): Promise<YoutubeSearchOutput> {
  const actionName = "directYoutubeSearch";
  console.log(`[Server Action] ${actionName} called for query: ${input.query}, maxResults: ${input.maxResults}`);

  if (typeof input.query !== 'string') {
    console.error(`[Server Action Error - ${actionName}] Query is not a string, received:`, input.query);
    throw new Error(`[Server Action - ${actionName}] Critical error: Query must be a string. Received type: ${typeof input.query}, value: ${input.query}`);
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error("YOUTUBE_API_KEY is not configured for direct search.");
    throw new Error('YouTube API key is not configured. Please set YOUTUBE_API_KEY in your .env file.');
  }

  // Construct query parameters for the YouTube API
  const params = new URLSearchParams({
    key: apiKey,
    part: 'snippet', // We need video title, description, thumbnails, etc.
    q: input.query.trim(),
    type: 'video', // Only search for videos
    maxResults: (input.maxResults || 8).toString(), // Default to 8 results if not specified
  });

  try {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Direct YouTube API Error:', errorData);
      throw new Error(`YouTube API request failed: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    // Map API response items to our YoutubeVideoItem structure
    const videos: YoutubeVideoItem[] = data.items?.map((item: any) => {
      let thumbnailUrl = item.snippet.thumbnails.default?.url;
      // Prefer medium or high-quality thumbnails if available
      if (item.snippet.thumbnails.medium?.url) {
        thumbnailUrl = item.snippet.thumbnails.medium.url;
      } else if (item.snippet.thumbnails.high?.url) {
        thumbnailUrl = item.snippet.thumbnails.high.url;
      }
      return {
        videoId: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: thumbnailUrl,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
      };
    }) || [];

    return { videos };
  } catch (error: any) {
    console.error(`[Server Action Error - ${actionName}] Error fetching from YouTube API:`, error);
    throw new Error(error.message || "Failed to fetch YouTube videos directly.");
  }
}

/**
 * directGoogleBooksSearch
 *
 * Performs a direct search on the Google Books API.
 * This is used by the Library page to fetch books without involving a Genkit flow for this specific search.
 *
 * @param input - Contains the search query and maximum results.
 * @returns A promise that resolves to a list of Google Book items.
 * @throws Error if the GOOGLE_BOOKS_API_KEY is not configured or if the API request fails.
 */
export async function directGoogleBooksSearch(input: GoogleBooksSearchInput): Promise<GoogleBooksSearchOutput> {
  const actionName = "directGoogleBooksSearch";
  console.log(`[Server Action] ${actionName} called for query: ${input.query}, maxResults: ${input.maxResults}`);

  if (typeof input.query !== 'string') {
    console.error(`[Server Action Error - ${actionName}] Query is not a string, received:`, input.query);
    throw new Error(`[Server Action - ${actionName}] Critical error: Query must be a string. Received type: ${typeof input.query}, value: ${input.query}`);
  }

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_BOOKS_API_KEY is not configured for direct search.");
    throw new Error('Google Books API key is not configured. Please set GOOGLE_BOOKS_API_KEY in your .env file.');
  }

  // Construct query parameters for the Google Books API
  const params = new URLSearchParams({
    q: input.query.trim(),
    maxResults: (input.maxResults || 9).toString(), // Default to 9 results
    country: 'US', // Explicitly setting country to fix server-side geo-restriction error
  });
  if (apiKey) { // API key is typically required
    params.append('key', apiKey);
  }
  
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?${params.toString()}`);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Direct Google Books API Error:', errorData);
      throw new Error(`Google Books API request failed: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    // Map API response items to our GoogleBookItem structure
    const books: GoogleBookItem[] = data.items?.map((item: any) => {
      const imageLinks = item.volumeInfo?.imageLinks;
      let thumbnailUrl;
      // Prioritize higher resolution thumbnails
      if (imageLinks?.large) thumbnailUrl = imageLinks.large;
      else if (imageLinks?.medium) thumbnailUrl = imageLinks.medium;
      else if (imageLinks?.thumbnail) thumbnailUrl = imageLinks.thumbnail;
      else if (imageLinks?.smallThumbnail) thumbnailUrl = imageLinks.smallThumbnail;

      return {
        bookId: item.id,
        title: item.volumeInfo?.title,
        authors: item.volumeInfo?.authors || [],
        description: item.volumeInfo?.description,
        thumbnailUrl: thumbnailUrl,
        publishedDate: item.volumeInfo?.publishedDate,
        pageCount: item.volumeInfo?.pageCount,
        infoLink: item.volumeInfo?.infoLink,
        embeddable: item.accessInfo?.embeddable || false,
        previewLink: item.volumeInfo?.previewLink,
        webReaderLink: item.accessInfo?.webReaderLink,
      };
    }).filter((book: any) => book.title) || []; // Filter out items without a title

    return { books };
  } catch (error: any) {
    console.error(`[Server Action Error - ${actionName}] Error fetching from Google Books API:`, error);
    throw new Error(error.message || "Failed to fetch Google Books directly.");
  }
}
