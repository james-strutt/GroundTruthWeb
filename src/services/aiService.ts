/**
 * AI analysis service — calls the Supabase Edge Function
 * (openai-vision) to analyse property photos from the web app.
 */

import { supabase } from '../supabaseClient';

const INSPECT_SYSTEM_PROMPT = [
  'You are GroundTruth, an expert Australian building inspector.',
  'Analyse the photograph for condition, materials, defects, and improvements.',
  'Your response MUST be valid JSON with these fields:',
  '- conditionScore (number): 1-10 condition rating',
  '- materials (string[]): materials visible',
  '- defects ({type, severity, description}[]): severity is "minor", "moderate", or "major"',
  '- improvements (string[]): visible improvements',
  '- constructionEra (string|null): estimated construction period',
  '- narrative (string): detailed description',
  'Use Australian English. Return raw JSON only.',
].join('\n');

const EXPLORE_SYSTEM_PROMPT = [
  'You are GroundTruth, an expert urban planner and liveability analyst.',
  'Assess the streetscape quality and liveability factors visible.',
  'Your response MUST be valid JSON with these fields:',
  '- walkability: {score (1-10), notes (string)}',
  '- streetscape: {score (1-10), notes (string)}',
  '- amenity: {score (1-10), visible (string[])}',
  '- safety: {score (1-10), notes (string)}',
  '- notableFeatures (string[]): positive features',
  '- concerns (string[]): negative observations',
  'Use Australian English. Return raw JSON only.',
].join('\n');

const SNAP_SYSTEM_PROMPT = [
  'You are GroundTruth, an expert Australian property analyst.',
  'You are shown a photograph of a property along with spatial planning data.',
  'Analyse the photograph and return a structured JSON assessment.',
  '',
  'Your response MUST be valid JSON with these fields:',
  '- summary (string): 2-3 sentence plain-English overview',
  '- propertyType (string): e.g. "detached dwelling", "semi-detached", "apartment block"',
  '- condition (string): one of "excellent", "good", "fair", "poor", "derelict"',
  '- estimatedAge (string|null): e.g. "5-10 years", "1960s"',
  '- storeys (number|null): visible storeys',
  '- constructionMaterial (string|null): primary wall material',
  '- roofMaterial (string|null): roof type and material',
  '- frontage (string|null): description of street frontage',
  '- landscaping (string|null): garden/landscape quality',
  '- observations (string[]): notable features or characteristics',
  '- risks (string[]): identified concerns',
  '- opportunities (string[]): potential improvements',
  '- confidenceScore (number): 0.0-1.0 confidence',
  '',
  'Use Australian English. Be specific. Return raw JSON only.',
].join('\n');

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
 * Call the openai-vision edge function.
 */
async function callVisionEdgeFunction(
  base64Image: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<VisionResponse> {
  if (!supabase) throw new Error('Supabase not configured');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

  const response = await fetch(`${supabaseUrl}/functions/v1/openai-vision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey,
    },
    body: JSON.stringify({ image: base64Image, systemPrompt, userPrompt }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Vision API error (${response.status}): ${errBody.slice(0, 200)}`);
  }

  const data = await response.json();

  const content = (data as { content?: string })?.content ?? '';
  let parsedJson: Record<string, unknown> | null = null;

  try {
    parsedJson = JSON.parse(content) as Record<string, unknown>;
  } catch {
    // Try extracting JSON from markdown code fences
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match?.[1]) {
      try {
        parsedJson = JSON.parse(match[1]) as Record<string, unknown>;
      } catch { /* not valid JSON */ }
    }
  }

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

  const userPrompt = `Analyse this property at ${address}. Return your assessment as JSON.`;
  const result = await callVisionEdgeFunction(base64, SNAP_SYSTEM_PROMPT, userPrompt);

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
  const systemPrompt = INSPECT_SYSTEM_PROMPT;
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
  const systemPrompt = EXPLORE_SYSTEM_PROMPT;
  const userPrompt = `Assess this streetscape photograph taken near ${location}. Return your assessment as JSON.`;
  const result = await callVisionEdgeFunction(base64, systemPrompt, userPrompt);
  if (!result.parsedJson) throw new Error('AI did not return valid JSON');
  return result.parsedJson;
}
