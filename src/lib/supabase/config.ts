// Configuration Supabase centralisée.
//
// L'URL du projet et la clé « anon / publishable » ne sont PAS secrètes :
// elles sont de toute façon exposées dans le bundle navigateur, et la sécurité
// repose sur la Row Level Security (RLS). Elles servent de valeurs par défaut
// pour que l'application fonctionne sans configuration au déploiement, tout en
// restant surchargeables via les variables d'environnement Vercel.
//
// ⚠️ Ne jamais mettre ici la clé service_role (secrète).

const DEFAULT_SUPABASE_URL = "https://igiudexyviijhekdtheu.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_R6-3F5akaC8Ih4inr549YQ_U7Tftmsc";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
