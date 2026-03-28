import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: "pkce",
        },
      })
    : null;

export async function insertWaitlistEmail(email: string) {
  if (!supabase) {
    console.warn("Supabase not configured");
    return { error: { code: "NO_CLIENT", message: "Supabase not configured" } };
  }
  return supabase.from("waitlist").insert({ email });
}

export async function getWaitlistCount(): Promise<number | null> {
  if (!supabase) return null;
  const { count, error } = await supabase
    .from("waitlist")
    .select("id", { count: "exact", head: true });
  if (error) return null;
  return count;
}
