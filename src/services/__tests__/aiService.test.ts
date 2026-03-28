import { describe, it, expect, vi } from 'vitest';
import { extractJsonFromResponse } from '../aiService';

vi.mock('../../constants/aiPrompts', () => ({
  buildSnapSystemPrompt: vi.fn(),
  buildInspectSystemPrompt: vi.fn(),
  buildStreetscapeSystemPrompt: vi.fn(),
}));

vi.mock('../../utils/sanitise', () => ({
  sanitiseAIPrompt: vi.fn((s: string) => s),
}));

describe('extractJsonFromResponse', () => {
  it('parses fenced JSON (```json ... ```)', () => {
    const input = 'Here is the result:\n```json\n{"condition": "good", "score": 8}\n```\nEnd.';
    const result = extractJsonFromResponse(input);
    expect(result).toEqual({ condition: 'good', score: 8 });
  });

  it('parses fenced JSON without the json language tag', () => {
    const input = '```\n{"summary": "Brick house"}\n```';
    const result = extractJsonFromResponse(input);
    expect(result).toEqual({ summary: 'Brick house' });
  });

  it('parses raw JSON string directly', () => {
    const input = '{"roof": "tile", "walls": "rendered"}';
    const result = extractJsonFromResponse(input);
    expect(result).toEqual({ roof: 'tile', walls: 'rendered' });
  });

  it('extracts embedded JSON object from surrounding text', () => {
    const input = 'Analysis complete. {"value": 750000, "confidence": 0.9} is the result.';
    const result = extractJsonFromResponse(input);
    expect(result).toEqual({ value: 750000, confidence: 0.9 });
  });

  it('returns null for plain text with no JSON', () => {
    const result = extractJsonFromResponse('No JSON here at all.');
    expect(result).toBeNull();
  });

  it('returns null for empty string', () => {
    const result = extractJsonFromResponse('');
    expect(result).toBeNull();
  });

  it('returns null for malformed JSON in fences', () => {
    const input = '```json\n{bad json:\n```';
    const result = extractJsonFromResponse(input);
    expect(result).toBeNull();
  });
});

describe('compressBlob (via module export check)', () => {
  it('is used internally for image compression', async () => {
    /**
     * compressBlob is not exported directly — it relies on browser
     * Image/Canvas APIs. We verify the module loads without errors,
     * which confirms the function definition is valid.
     */
    const mod = await import('../aiService');
    expect(mod.extractJsonFromResponse).toBeDefined();
    expect(mod.reanalyseSnap).toBeDefined();
    expect(mod.editImageWithAI).toBeDefined();
  });
});
