
/**
 * LearnMint: Your AI-Powered Learning Assistant
 * @author MrGarvit
 * @fileOverview An AI agent that converts text into a multi-speaker audio discussion.
 * This flow now has simplified prompting and more robust error handling.
 */

'use server';

import { ai, aiForTTS } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';

const GenerateDiscussionAudioInputSchema = z.object({
  content: z.string().describe('The content to be turned into a discussion.'),
});
export type GenerateDiscussionAudioInput = z.infer<typeof GenerateDiscussionAudioInputSchema>;

const GenerateDiscussionAudioOutputSchema = z.object({
  audioDataUri: z.string().describe('The generated audio discussion as a data URI.'),
});
export type GenerateDiscussionAudioOutput = z.infer<typeof GenerateDiscussionAudioOutputSchema>;

// This function is exported and called from a server action.
export async function generateDiscussionAudio(input: GenerateDiscussionAudioInput): Promise<GenerateDiscussionAudioOutput> {
  try {
    return await generateDiscussionAudioFlow(input);
  } catch (error: any) {
    console.error(`[AI Action Error - Discussion Audio] Flow failed:`, error);
    let errorMessage = "Failed to generate discussion audio. Please try again.";
    if (error.message) {
      if (error.message.includes("API key") || error.message.includes("permission denied")) {
        errorMessage = "Discussion Audio: API key issue. Check that GOOGLE_API_KEY (for text) and GOOGLE_API_KEY_TTS are correctly configured and have the necessary permissions.";
      } else if (error.message.includes("Invalid format from LLM")) {
        errorMessage = "Discussion Audio: The AI failed to generate a valid script. This can happen with very complex or unusual content. Please try again.";
      } else {
        errorMessage = `Discussion Audio: ${error.message}`;
      }
    }
    throw new Error(errorMessage);
  }
}

// Helper to convert PCM data to WAV Base64
async function toWav(pcmData: Buffer, channels = 1, rate = 24000, sampleWidth = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({ channels, sampleRate: rate, bitDepth: sampleWidth * 8 });
    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));
    writer.write(pcmData);
    writer.end();
  });
}

// Simplified and more robust prompt for dialogue generation.
const dialoguePrompt = ai.definePrompt({
    name: 'generateDialogueForTtsPrompt',
    model: 'gemini-2.5-flash-lite-preview-06-17',
    input: { schema: GenerateDiscussionAudioInputSchema },
    output: { schema: z.object({ dialogue: z.string() }) },
    prompt: `You are an expert scriptwriter. Your task is to convert the provided text content into a natural-sounding, two-person dialogue script in the same language as the source content.

The dialogue should be between "Speaker1" (a knowledgeable expert) and "Speaker2" (an inquisitive learner). It should discuss and explain the key points from the provided content.

**CRITICAL FORMATTING RULE**: The entire output MUST be ONLY the script. Each line must start with "Speaker1:" or "Speaker2:". Do NOT add any introductory text, closing remarks, or summaries.

Example Format:
Speaker1: [First line of dialogue]
Speaker2: [Second line of dialogue]
Speaker1: [Third line of dialogue]

Content to convert:
---
{{{content}}}
---

Please provide the dialogue script below.`,
    config: {
        safetySettings: [
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        ],
        temperature: 0.5,
    }
});


// The main Genkit flow, defined with the general `ai` client.
const generateDiscussionAudioFlow = ai.defineFlow(
  {
    name: 'generateDiscussionAudioFlow',
    inputSchema: GenerateDiscussionAudioInputSchema,
    outputSchema: GenerateDiscussionAudioOutputSchema,
  },
  async (input) => {
    // 1. Generate the dialogue script from the input content
    console.log(`[AI Flow - Discussion Audio] Generating dialogue script...`);
    const { output } = await dialoguePrompt(input);
    let dialogueScript = output?.dialogue;

    if (!dialogueScript || dialogueScript.trim() === '') {
      throw new Error("Failed to generate a dialogue script from the content.");
    }
    console.log('[AI Flow - Discussion Audio] Dialogue script generated successfully.');
    
    // Safeguard: Clean up potential model verbosity
    const firstSpeaker1 = dialogueScript.indexOf('Speaker1:');
    const firstSpeaker2 = dialogueScript.indexOf('Speaker2:');
    
    let startIndex = -1;
    if (firstSpeaker1 === -1) startIndex = firstSpeaker2;
    else if (firstSpeaker2 === -1) startIndex = firstSpeaker1;
    else startIndex = Math.min(firstSpeaker1, firstSpeaker2);

    if (startIndex > 0) {
        console.warn(`[AI Flow - Discussion Audio] Cleaning up unexpected preamble from dialogue script.`);
        dialogueScript = dialogueScript.substring(startIndex);
    } else if (startIndex === -1) {
        throw new Error("Generated script does not contain 'Speaker1:' or 'Speaker2:'. Invalid format from LLM.");
    }

    // 2. Generate multi-speaker audio from the script
    console.log('[AI Flow - Discussion Audio] Generating multi-speaker TTS...');
    const { media } = await aiForTTS.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              { speaker: 'Speaker1', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Algenib' } } }, // Male
              { speaker: 'Speaker2', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Achernar' } } }, // Female
            ],
          },
        },
      },
      prompt: dialogueScript,
    });

    if (!media) {
      throw new Error('TTS model did not return any media.');
    }
    console.log('[AI Flow - Discussion Audio] TTS audio data received.');

    // 3. Convert PCM audio to WAV format
    const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    const wavBase64 = await toWav(audioBuffer);
    console.log('[AI Flow - Discussion Audio] Audio converted to WAV successfully.');

    return {
      audioDataUri: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);
