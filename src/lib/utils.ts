
/**
 * @fileoverview Provides utility functions used throughout the application.
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts text content from a PDF file.
 * This function dynamically imports pdfjs-dist to ensure it only runs on the client-side,
 * preventing server-side build warnings and errors.
 * @param file The PDF file to process.
 * @returns A promise that resolves to the extracted text as a single string.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  // Dynamically import the library to ensure it's client-side only.
  const pdfjsLib = await import('pdfjs-dist');

  // Set worker source for pdf.js. Using a CDN is a reliable way to ensure the worker is available.
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      // 'str' is a property on the items array in the text content
      const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
      fullText += pageText + '\n\n';
    } catch (error) {
      console.error(`Error processing page ${i} of PDF:`, error);
      // Continue to next page if one fails
    }
  }

  return fullText.trim();
}

/**
 * Splits a long string of text into smaller chunks based on a maximum length.
 * It tries to split along sentences to maintain context.
 * @param text The full text to split.
 * @param maxLength The maximum character length for each chunk.
 * @returns An array of text chunks.
 */
export function chunkText(text: string, maxLength = 3000): string[] {
  if (text.length <= maxLength) {
    return [text];
  }
  
  const sentences = text.split(/(?<=[.?!])\s+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length + 1 > maxLength) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk.length > 0 ? " " : "") + sentence;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  // If a single sentence is longer than maxLength, it will be its own chunk.
  // This logic is simple and avoids complex word-by-word splitting for now.
  return chunks;
}
