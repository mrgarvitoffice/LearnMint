'use server';

import { aiForNotes, aiForTTS } from '@/ai/genkit';
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

export async function generateDiscussionAudio(input: GenerateDiscussionAudioInput): Promise<GenerateDiscussionAudioOutput> {
  try {
    return await generateDiscussionAudioFlow(input);
  } catch(e: any) {
    console.error(`[AI Action Error - Generate Discussion] Flow failed: ${e.message}`);
    throw new Error(`Failed to generate audio discussion. Please try again. Details: ${e.message}`);
  }
}

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

const dialoguePrompt = aiForNotes.definePrompt({
    name: 'generateDialogueForTtsPrompt',
    model: 'googleai/gemini-1.5-flash-latest', // Use a more capable model for script generation
    input: { schema: z.object({ content: z.string() }) },
    output: { format: 'text' },
    prompt: `You are an expert multilingual scriptwriter. Your task is to convert the given text content into a natural-sounding, two-person dialogue script.

**Language Rules:**
1.  First, detect the primary language of the input content.
2.  The entire output script **MUST** be written in that same language.

**Participants:**
-   **Speaker1:** A knowledgeable expert, with a slightly formal tone.
-   **Speaker2:** An inquisitive learner, with a friendly and curious tone.

**CRITICAL FORMATTING RULES:**
-   Every single line of your output **MUST** start with either "Speaker1:" or "Speaker2:".
-   Do **NOT** include any other text, introductions, summaries, or stage directions (like "smiles" or "nods").
-   The output must **ONLY** contain the dialogue lines, each on a new line.

**Example Input:**
"The mitochondria is the powerhouse of the cell."

**Example Output:**
Speaker1: Did you know that the mitochondria is often called the powerhouse of the cell?
Speaker2: Oh, really? Why is that?
Speaker1: It's because it generates most of the cell's supply of adenosine triphosphate, used as a source of chemical energy.
Speaker2: Wow, that's fascinating!

---
**Content to convert to a dialogue script:**
{{{content}}}
---`,
    config: {
        temperature: 0.4,
    }
});

const generateDiscussionAudioFlow = aiForTTS.defineFlow(
  {
    name: 'generateDiscussionAudioFlow',
    inputSchema: GenerateDiscussionAudioInputSchema,
    outputSchema: GenerateDiscussionAudioOutputSchema,
  },
  async (input) => {
    // 1. Generate the dialogue script
    console.log('[AI Flow] Generating dialogue script...');
    const llmResponse = await dialoguePrompt({ content: input.content });
    const rawScript = llmResponse.text;

    if (!rawScript?.trim()) {
      throw new Error("Empty dialogue script generated");
    }
    
    // Clean and validate script
    const scriptLines = rawScript.split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('Speaker1:') || line.startsWith('Speaker2:'));

    if (scriptLines.length === 0) {
      throw new Error("No valid dialogue lines found");
    }

    const dialogueScript = scriptLines.join('\n');
    console.log('[AI Flow] Dialogue generated:', dialogueScript);

    // 2. Generate TTS audio
    console.log('[AI Flow] Generating TTS audio...');
    const { media } = await aiForTTS.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              { speaker: 'Speaker1', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Algenib' } } },
              { speaker: 'Speaker2', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Achernar' } } },
            ],
          },
        },
      },
      prompt: dialogueScript,
    });

    if (!media?.url) {
      throw new Error('No audio data received from TTS service');
    }

    // 3. Convert to WAV
    const audioBuffer = Buffer.from(media.url.split(',')[1], 'base64');
    const wavBase64 = await toWav(audioBuffer);
    
    return {
      audioDataUri: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);
