// Configuration Supabase centralisée.
// Aucune clé Supabase n'est codée dans le dépôt : configurez Vercel avec
// NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.
// SUPABASE_SERVICE_ROLE_KEY reste strictement serveur et ne doit jamais être
// importée dans un composant client.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const isSupabaseAdminConfigured = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
