/**
 * AI analysis service — calls the Supabase Edge Function
 * (openai-vision) to analyse property photos from the web app.
 */

import { supabase } from '../supabaseClient';
import { sanitiseAIPrompt } from '../utils/sanitise';
import {
  buildSnapSystemPrompt,
  buildInspectSystemPrompt,
  buildStreetscapeSystemPrompt,
} from '../constants/aiPrompts';
import type { SnapPromptContext } from '../constants/aiPrompts';

interface VisionResponse {
  content: string;
  parsedJson: Record<string, unknown> | null;
}

/**
 * Fetch a photo URL and convert to base64.
 * Uses no-cors fallback and proxy approach for cross-origin images.
 */
async function photoUrlToBase64(url: string): Promise<string> {
  // Try direct fetch first, compress via canvas
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      return await compressBlob(blob);
    }
  } catch {
    // CORS blocked — try via canvas fallback below
  }

  // Fallback: load via Image element, resize to max 1024px to stay under edge function limits
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const MAX = 1024;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > MAX || h > MAX) {
        const scale = MAX / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      resolve(dataUrl.split(',')[1] ?? '');
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

/** Compress an image blob to max 1024px JPEG for edge function size limits */
function compressBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1024;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > MAX || h > MAX) {
        const scale = MAX / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      URL.revokeObjectURL(img.src);
      resolve(dataUrl.split(',')[1] ?? '');
    };
    img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error('Failed to load image for compression')); };
    img.src = URL.createObjectURL(blob);
  });
}


/**
 * Get the current user's JWT for authenticated edge function calls.
 * Falls back to the anon key if no session exists (should not happen in practice).
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
  let bearer = supabaseKey;

  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      bearer = session.access_token;
    }
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${bearer}`,
    'apikey': supabaseKey,
  };
}

/**
 * Extract a JSON object from an AI response string.
 * Handles raw JSON, markdown code fences, and embedded JSON objects.
 * Returns null if no valid JSON is found.
 */
export function extractJsonFromResponse(content: string): Record<string, unknown> | null {
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    // Try extracting JSON from markdown code fences
    const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch?.[1]) {
      try {
        return JSON.parse(fenceMatch[1]) as Record<string, unknown>;
      } catch { /* not valid JSON */ }
    }
    // Try finding a raw JSON object in the content
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]) as Record<string, unknown>;
      } catch { /* not valid JSON */ }
    }
    return null;
  }
}

/**
 * Call the openai-vision edge function.
 */
async function callVisionEdgeFunction(
  base64Image: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<VisionResponse> {
  if (!supabase) throw new Error('Supabase not configured');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
  const headers = await getAuthHeaders();

  const response = await fetch(`${supabaseUrl}/functions/v1/openai-vision`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ image: base64Image, systemPrompt, userPrompt }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Vision API error (${response.status}): ${errBody.slice(0, 200)}`);
  }

  const data = await response.json();

  const content = (data as { content?: string })?.content ?? '';
  const parsedJson = extractJsonFromResponse(content);

  return { content, parsedJson };
}

/**
 * Re-analyse a snap photo and return the new AI analysis.
 */
export async function reanalyseSnap(
  photoUrl: string,
  address: string,
): Promise<Record<string, unknown>> {
  if (!photoUrl.startsWith('http')) {
    throw new Error('Photo not yet synced to cloud. Re-sync from the iOS app first (Profile > Sync to Cloud).');
  }

  let base64: string;
  try {
    base64 = await photoUrlToBase64(photoUrl);
  } catch {
    throw new Error('Failed to load photo from storage. The image may have been deleted.');
  }

  const snapCtx: SnapPromptContext = {
    address,
    areaSqm: null,
    zoneCode: null,
    zoneLabel: null,
    fsr: null,
    hobMetres: null,
  };
  const systemPrompt = buildSnapSystemPrompt(snapCtx);
  const userPrompt = `Analyse this property at ${address}. Return your assessment as JSON.`;
  const result = await callVisionEdgeFunction(base64, systemPrompt, userPrompt);

  if (!result.parsedJson) {
    throw new Error('AI did not return valid JSON. Raw: ' + result.content.slice(0, 100));
  }

  return result.parsedJson;
}

/**
 * Re-analyse an inspection photo.
 */
export async function reanalyseInspectionPhoto(
  photoUrl: string,
  address: string,
  tag: string,
): Promise<Record<string, unknown>> {
  const base64 = await photoUrlToBase64(photoUrl);
  const systemPrompt = buildInspectSystemPrompt({
    photoLabel: tag,
    tags: [tag],
    caption: null,
  });
  const userPrompt = `Inspect this ${tag} photo of the property at ${address}. Return your assessment as JSON.`;
  const result = await callVisionEdgeFunction(base64, systemPrompt, userPrompt);
  if (!result.parsedJson) throw new Error('AI did not return valid JSON');
  return result.parsedJson;
}

/**
 * Re-analyse a walk/explore photo for streetscape assessment.
 */
export async function reanalyseWalkPhoto(
  photoUrl: string,
  location: string,
): Promise<Record<string, unknown>> {
  const base64 = await photoUrlToBase64(photoUrl);
  const systemPrompt = buildStreetscapeSystemPrompt({
    streetName: location,
    photoIndex: 0,
    photoCount: 1,
  });
  const userPrompt = `Assess this streetscape photograph taken near ${location}. Return your assessment as JSON.`;
  const result = await callVisionEdgeFunction(base64, systemPrompt, userPrompt);
  if (!result.parsedJson) throw new Error('AI did not return valid JSON');
  return result.parsedJson;
}

/**
 * Edit a photo using AI (Google Gemini) via the gemini-image-edit edge function.
 * Converts the photo to base64, sends it with the prompt, and returns
 * a data URL of the edited image.
 */
export async function editImageWithAI(
  photoUrl: string,
  editPrompt: string,
): Promise<{ editedImageUrl: string }> {
  if (!supabase) throw new Error('Supabase not configured');
  if (!photoUrl.startsWith('http')) {
    throw new Error('Photo not yet synced to cloud. Re-sync from the iOS app first.');
  }

  const base64 = await photoUrlToBase64(photoUrl);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
  const headers = await getAuthHeaders();

  const response = await fetch(`${supabaseUrl}/functions/v1/gemini-image-edit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ image: base64, prompt: sanitiseAIPrompt(editPrompt) }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Image edit failed (${response.status}): ${errBody.slice(0, 200)}`);
  }

  const data = await response.json() as { editedImage?: string; mimeType?: string; error?: string };

  if (data.error) {
    throw new Error(`Image edit error: ${data.error}`);
  }

  if (!data.editedImage) {
    throw new Error('Gemini did not return an edited image');
  }

  const mimeType = data.mimeType ?? 'image/png';
  const editedImageUrl = `data:${mimeType};base64,${data.editedImage}`;

  return { editedImageUrl };
}

/**
 * Refine/integrate voice transcription with existing text using AI.
 * Uses a minimal placeholder image since the edge function requires one.
 */
const REFINE_SYSTEM_PROMPT = [
  'You are GroundTruth, an expert property analyst assistant.',
  'The user has existing text about a property and wants to integrate new notes from a voice transcription.',
  'Merge the voice notes into the existing text naturally, preserving the original structure and adding new information.',
  'If the existing text is empty, just clean up the voice transcription into professional property notes.',
  'Return ONLY the refined text as a plain string, no JSON wrapping, no code fences, no explanations.',
  'Use Australian English.',
].join('\n');

// 1x1 white JPEG placeholder for text-only prompts
const PLACEHOLDER_IMAGE = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AKwA=';

export async function refineTextWithAI(
  existingText: string,
  voiceTranscription: string,
): Promise<string> {
  const userPrompt = existingText
    ? `Existing text:\n"${existingText}"\n\nNew voice notes to integrate:\n"${voiceTranscription}"\n\nReturn the merged text.`
    : `Voice notes to refine into professional property notes:\n"${voiceTranscription}"\n\nReturn the refined text.`;

  const result = await callVisionEdgeFunction(PLACEHOLDER_IMAGE, REFINE_SYSTEM_PROMPT, userPrompt);
  return result.content.trim();
}
