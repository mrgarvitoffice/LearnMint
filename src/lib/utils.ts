/**
 * LearnMint: Your AI-Powered Learning Assistant
 * @author MrGarvit
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
