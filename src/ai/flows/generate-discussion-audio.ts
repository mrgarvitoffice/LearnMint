
/**
 * LearnMint: Your AI-Powered Learning Assistant
 * @author MrGarvit
 * @fileOverview An AI agent that converts text into a multi-speaker audio discussion.
 * This flow now auto-detects the language from the input content.
 *
 * - generateDiscussionAudio - A function that handles the discussion generation process.
 * - GenerateDiscussionAudioInput - The input type for this function.
 * - GenerateDiscussionAudioOutput - The return type for this function.
 */

'use server';

import { aiForTTS } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';

// Input schema no longer requires languageName.
const GenerateDiscussionAudioInputSchema = z.object({
  content: z.string().describe('The content to be turned into a discussion.'),
  languageName: z.string().optional().describe('The full language name for the audio output (e.g., "Japanese", "Spanish"). If not provided, the language will be auto-detected from the content.'),
});
export type GenerateDiscussionAudioInput = z.infer<typeof GenerateDiscussionAudioInputSchema>;

const GenerateDiscussionAudioOutputSchema = z.object({
  audioDataUri: z.string().describe('The generated audio discussion as a data URI.'),
});
export type GenerateDiscussionAudioOutput = z.infer<typeof GenerateDiscussionAudioOutputSchema>;

export async function generateDiscussionAudio(input: GenerateDiscussionAudioInput): Promise<GenerateDiscussionAudioOutput> {
  return generateDiscussionAudioFlow(input);
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

// Updated prompt to self-determine the language and be more robust.
const dialoguePrompt = aiForTTS.definePrompt({
    name: 'generateDialogueForTtsPrompt',
    model: 'googleai/gemini-2.5-flash-lite-preview-06-17',
    input: { schema: GenerateDiscussionAudioInputSchema },
    output: { schema: z.object({ dialogue: z.string() }) },
    prompt: `You are an expert scriptwriter. Your primary task is to convert the given text content into a natural-sounding, two-person dialogue script.

    1.  **Analyze the Language**: 
        {{#if languageName}}
        The user has explicitly requested the output language to be **{{{languageName}}}**. You **MUST** write the entire script in this language.
        {{else}}
        First, determine the primary language of the provided "Content to convert". Then, write a dialogue script in that *same language* between "Speaker1" (a knowledgeable and slightly formal expert) and "Speaker2" (an inquisitive and friendly learner).
        {{/if}}
        The dialogue should discuss and explain the key points from the content.

    2.  **Strict Formatting**: The output MUST be ONLY the script, formatted *exactly* like this, with each line starting with "Speaker1:" or "Speaker2:":
        Speaker1: [First line of dialogue]
        Speaker2: [Second line of dialogue]
        ...and so on.

    **CRITICAL**: Do NOT add any introductory text, closing remarks, summaries, or any text other than the dialogue lines themselves. The entire output must begin directly with "Speaker1:" or "Speaker2:".

    Content to convert:
    ---
    {{{content}}}
    ---

    Please provide the dialogue script below.`,
});


// The main Genkit flow
const generateDiscussionAudioFlow = aiForTTS.defineFlow(
  {
    name: 'generateDiscussionAudioFlow',
    inputSchema: GenerateDiscussionAudioInputSchema,
    outputSchema: GenerateDiscussionAudioOutputSchema,
  },
  async (input) => {
    // 1. Generate the dialogue script from the input content
    console.log(`[AI Flow - Discussion Audio] Generating dialogue script in ${input.languageName || 'auto-detected language'}...`);
    const { output } = await dialoguePrompt(input);
    let dialogueScript = output?.dialogue;

    if (!dialogueScript || dialogueScript.trim() === '') {
      throw new Error("Failed to generate a dialogue script from the content.");
    }
    console.log('[AI Flow - Discussion Audio] Dialogue script generated successfully.');
    
    // Safeguard: Clean up potential model verbosity by stripping any text before the first speaker tag.
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
