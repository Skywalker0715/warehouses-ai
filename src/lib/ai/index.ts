import 'server-only';
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * AI Model constants for selection within the application.
 */
export const AI_MODELS = {
  FAST: "gemini-2.5-flash",   // Versi terbaru 2026, sangat cepat & quota luas
  SMART: "gemini-2.5-flash",  // Gunakan flash untuk menghindari limit 429 pada model Pro
} as const;

/**
 * Approximate token limits for internal usage control.
 */
export const TOKEN_LIMITS = {
  MAX_CONTEXT: 4000,
  MAX_RESPONSE: 1000,
} as const;

/**
 * Checks if the required Gemini API configuration is present.
 */
export function isAIConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

/**
 * Helper function to generate AI responses using the Gemini models.
 * 
 * @param prompt - The input text for the AI.
 * @param modelType - Which model variant to use (FAST or SMART).
 */
export async function askAI(
  prompt: string,
  modelType: "FAST" | "SMART" = "FAST"
): Promise<string> {
  if (!isAIConfigured()) {
    throw new Error("Gemini API Key tidak ditemukan. Harap cek file .env");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: AI_MODELS[modelType],
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;

  return response.text();
}