import { createClient, isSupabaseConfigured } from "./server";
import type { AppNotification, Profile } from "@/lib/types";

export interface SessionContext {
  profile: Profile;
  notifications: AppNotification[];
}

/**
 * Contexte de l'utilisateur connecté (profil + notifications).
 * Renvoie null si Supabase n'est pas configuré ou si aucune session n'existe,
 * afin que l'interface bascule sur les données de démonstration.
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profileRow }, { data: notifications }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const profile: Profile = profileRow ?? {
    id: user.id,
    email: user.email ?? "",
    full_name: (user.user_metadata?.full_name as string) ?? "",
    role: "freelance",
    avatar_url: null,
    company_name: null,
    created_at: user.created_at ?? new Date().toISOString(),
  };

  return { profile, notifications: (notifications ?? []) as AppNotification[] };
}

/** True si un utilisateur est connecté (Supabase configuré + session). */
export async function isAuthenticated(): Promise<boolean> {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user;
}
