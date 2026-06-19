import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

// Client Supabase côté navigateur. Renvoie null si la config n'est pas
// présente — l'app bascule alors sur les données de démonstration.
export function createClient() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export { isSupabaseConfigured };
