import 'server-only';

/**
 * Removes or masks sensitive data from text before it is sent to an AI API.
 * Handles emails, phone numbers, UUIDs, and long alphanumeric secrets.
 * 
 * @param text - The raw context string to be cleaned.
 * @returns Cleaned and normalized text.
 */
export function sanitizeForAI(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. Mask Email Addresses
  cleaned = cleaned.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]');

  // 2. Mask Phone Numbers (matches various international and local formats)
  cleaned = cleaned.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4,}/g, '[phone]');

  // 3. Mask UUID-like strings (common in DB IDs)
  cleaned = cleaned.replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '[id]');

  // 4. Mask API keys / Secrets (Alphanumeric > 20 chars, no spaces)
  // We use word boundaries to avoid catching sentences.
  cleaned = cleaned.replace(/\b[a-zA-Z0-9]{21,}\b/g, '[secret]');

  // 5. Normalize whitespace and trim
  return cleaned
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Truncates text based on an approximate token count (1 token ≈ 4 characters).
 * Attempts to truncate at a word boundary to keep the text readable.
 * 
 * @param text - The text to truncate.
 * @param maxTokens - Maximum allowed tokens (default 3000).
 */
export function truncateContext(text: string, maxTokens: number = 3000): string {
  const maxLength = maxTokens * 4;

  if (text.length <= maxLength) {
    return text;
  }

  // Attempt to find the last space within the limit to avoid breaking words
  let truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.8) {
    truncated = truncated.slice(0, lastSpace);
  }

  return `${truncated.trim()}...[data dipotong]`;
}

interface ContextValidation {
  isValid: boolean;
  estimatedTokens: number;
  message?: string;
}

/**
 * Validates if the context size is within the acceptable token limit for Gemini.
 * 
 * @param text - The text to validate.
 */
export function validateContextSize(text: string): ContextValidation {
  // Estimate tokens: Math.ceil because even a single extra char counts as a new token fragment
  const estimatedTokens = Math.ceil(text.length / 4);
  const LIMIT = 4000;

  if (estimatedTokens > LIMIT) {
    return {
      isValid: false,
      estimatedTokens,
      message: "Konteks terlalu besar, data akan dipotong"
    };
  }

  return {
    isValid: true,
    estimatedTokens
  };
}