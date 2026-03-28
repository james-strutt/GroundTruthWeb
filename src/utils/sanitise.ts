/**
 * Input sanitisation utilities for user-provided text
 * that gets passed to AI services or database queries.
 */

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?prior\s+instructions/i,
  /you\s+are\s+now\s+/i,
  /act\s+as\s+(a\s+)?/i,
  /system\s*:\s*/i,
  /\[INST\]/i,
  /\[SYSTEM\]/i,
  /<<SYS>>/i,
  /<\|im_start\|>/i,
];

/**
 * Strip prompt injection patterns from user input destined for AI services.
 * Returns the cleaned string.
 */
export function sanitiseAIPrompt(input: string, maxLength = 500): string {
  let cleaned = input.slice(0, maxLength).trim();
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  return cleaned.trim();
}

/**
 * Strip characters that could interfere with Supabase ilike queries.
 * Escapes SQL wildcards and removes suspicious patterns.
 */
export function sanitiseSearchQuery(input: string, maxLength = 200): string {
  return input
    .slice(0, maxLength)
    .replace(/%/g, '')
    .replace(/_/g, ' ')
    .replace(/[;'"\\]/g, '')
    .trim();
}
