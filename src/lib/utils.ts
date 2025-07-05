import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as pdfjsLib from 'pdfjs-dist';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Set worker source for pdf.js. This is crucial for it to work in the browser.
// Using a CDN is a reliable way to ensure the worker is available.
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;
}

/**
 * Extracts text content from a PDF file.
 * @param file The PDF file to process.
 * @returns A promise that resolves to the extracted text as a single string.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
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
