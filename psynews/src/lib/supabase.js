import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[PsyNews] Supabase env vars not set. " +
      "Copy .env.example to .env.local and fill in your project URL and anon key. " +
      "The app will fall back to local placeholder data."
  );
}

// createClient is safe to call even with empty strings; queries will fail gracefully
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

/** True when real credentials are configured */
export const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  supabaseUrl !== "https://placeholder.supabase.co";
