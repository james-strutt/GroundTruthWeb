/**
 * Image upload utilities — AI-edited images to Supabase Storage.
 */

import { supabase } from "../supabaseClient";
import { ensureAuthSessionLoaded } from "./shared/supabaseHelpers";

/** Upload a base64 data URL to Supabase Storage and return the public URL */
export async function uploadEditedImage(
  dataUrl: string,
  folder: string,
  recordId: string,
): Promise<string> {
  if (!supabase) throw new Error("Supabase not configured");
  if (!(await ensureAuthSessionLoaded())) {
    throw new Error("You must be signed in to upload images.");
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match || !match[1] || !match[2]) throw new Error("Invalid data URL");
  const mimeType = match[1];
  const base64 = match[2];
  const ext = mimeType === "image/png" ? "png" : "jpg";

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const path = `${folder}/${recordId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("ai-edits")
    .upload(path, bytes, { contentType: mimeType, upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from("ai-edits")
    .getPublicUrl(path);
  return urlData.publicUrl;
}
