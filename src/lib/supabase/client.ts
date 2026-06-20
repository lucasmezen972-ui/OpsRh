import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

// Client Supabase côté navigateur. Renvoie null si la config n'est pas
// présente — les pages privées affichent une erreur ou redirigent vers la connexion.
export function createClient() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export { isSupabaseConfigured };
