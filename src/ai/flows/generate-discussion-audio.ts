/**
 * LearnMint: Your AI-Powered Learning Assistant
 * @author MrGarvit
 * @fileOverview An AI agent that converts text into a multi-speaker audio discussion.
 * This flow is now re-architected for maximum reliability.
 */

'use server';

import { aiForNotes, aiForTTS } from '@/ai/genkit'; // Using aiForNotes for text, aiForTTS for audio
import { z } from 'zod';
import wav from 'wav';

const GenerateDiscussionAudioInputSchema = z.object({
  content: z.string().min(20, "Content must be at least 20 characters.").describe('The content to be turned into a discussion.'),
});
export type GenerateDiscussionAudioInput = z.infer<typeof GenerateDiscussionAudioInputSchema>;

const GenerateDiscussionAudioOutputSchema = z.object({
  audioDataUri: z.string().describe('The generated audio discussion as a data URI.'),
});
export type GenerateDiscussionAudioOutput = z.infer<typeof GenerateDiscussionAudioOutputSchema>;

// This function is the main entry point called by the server action.
export async function generateDiscussionAudio(input: GenerateDiscussionAudioInput): Promise<GenerateDiscussionAudioOutput> {
  // The main try-catch block is now in the server action for better UI feedback.
  return await generateDiscussionAudioFlow(input);
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

// STEP 1: Define a prompt to generate the dialogue script as plain text.
// This is more reliable than requesting a JSON object.
const dialoguePrompt = aiForNotes.definePrompt({
    name: 'generateDialogueForTtsPrompt',
    model: 'gemini-2.5-flash-lite-preview-06-17',
    input: { schema: GenerateDiscussionAudioInputSchema },
    output: { format: 'text' }, // Requesting plain text is more reliable.
    prompt: `You are a scriptwriter. Convert the following content into a natural-sounding, two-person dialogue script.
The dialogue should be between "Speaker1" and "Speaker2". It should discuss and explain the key points from the provided content.

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

// STEP 2: Define the main flow that orchestrates the process.
const generateDiscussionAudioFlow = aiForNotes.defineFlow(
  {
    name: 'generateDiscussionAudioFlow',
    inputSchema: GenerateDiscussionAudioInputSchema,
    outputSchema: GenerateDiscussionAudioOutputSchema,
  },
  async (input) => {
    // 1. Generate the dialogue script using the text-generation prompt.
    console.log(`[AI Flow - Discussion Audio] Generating dialogue script...`);
    const llmResponse = await dialoguePrompt(input);
    let dialogueScript = llmResponse.text;

    if (!dialogueScript || dialogueScript.trim() === '') {
      throw new Error("AI failed to generate a dialogue script from the content.");
    }
    console.log('[AI Flow - Discussion Audio] Dialogue script generated successfully.');
    
    // SAFEGUARD: Clean up potential model verbosity to ensure script starts correctly.
    const firstSpeaker1 = dialogueScript.indexOf('Speaker1:');
    const firstSpeaker2 = dialogueScript.indexOf('Speaker2:');
    
    let startIndex = -1;
    if (firstSpeaker1 === -1 && firstSpeaker2 === -1) {
        throw new Error("Generated script does not contain 'Speaker1:' or 'Speaker2:'. Invalid format from LLM.");
    }
    if (firstSpeaker1 !== -1 && firstSpeaker2 !== -1) {
      startIndex = Math.min(firstSpeaker1, firstSpeaker2);
    } else if (firstSpeaker1 !== -1) {
      startIndex = firstSpeaker1;
    } else {
      startIndex = firstSpeaker2;
    }

    if (startIndex > 0) {
        console.warn(`[AI Flow - Discussion Audio] Cleaning up unexpected preamble from dialogue script.`);
        dialogueScript = dialogueScript.substring(startIndex);
    }

    // 2. Generate multi-speaker audio from the script using the dedicated TTS client.
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

    // 3. Convert PCM audio to WAV format.
    const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    const wavBase64 = await toWav(audioBuffer);
    console.log('[AI Flow - Discussion Audio] Audio converted to WAV successfully.');

    return {
      audioDataUri: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);
