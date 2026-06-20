import { createClient, isSupabaseConfigured } from "./server";

export interface OnboardingStatus {
  hasClient: boolean;
  hasCase: boolean;
  hasChecklist: boolean;
  hasTask: boolean;
  hasPortalContact: boolean;
  done: number;
  total: number;
  complete: boolean;
}

async function countExists(
  supabase: NonNullable<ReturnType<typeof createClient>>,
  table: string,
  column: string,
  value: string,
  extra?: (q: any) => any
) {
  let query = supabase.from(table).select("*", { count: "exact", head: true }).eq(column, value);
  if (extra) query = extra(query);
  const { count } = await query;
  return (count ?? 0) > 0;
}

/**
 * État d'avancement de la prise en main, pour l'utilisateur connecté.
 * Renvoie null en mode démo (l'onboarding ne s'affiche pas).
 */
export async function getOnboardingStatus(): Promise<OnboardingStatus | null> {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Identifiants des clients de l'utilisateur (pour les contacts portail).
  const { data: clients } = await supabase.from("clients").select("id").eq("owner_id", user.id);
  const clientIds = (clients ?? []).map((c) => c.id);

  const [hasCase, hasChecklist, hasTask] = await Promise.all([
    countExists(supabase, "hr_cases", "owner_id", user.id),
    countExists(supabase, "document_checklists", "owner_id", user.id),
    countExists(supabase, "tasks", "owner_id", user.id),
  ]);

  let hasPortalContact = false;
  if (clientIds.length > 0) {
    const { count } = await supabase
      .from("client_contacts")
      .select("*", { count: "exact", head: true })
      .in("client_id", clientIds)
      .eq("portal_access", true);
    hasPortalContact = (count ?? 0) > 0;
  }

  const steps = [clientIds.length > 0, hasCase, hasChecklist, hasTask, hasPortalContact];
  const done = steps.filter(Boolean).length;

  return {
    hasClient: clientIds.length > 0,
    hasCase,
    hasChecklist,
    hasTask,
    hasPortalContact,
    done,
    total: steps.length,
    complete: done === steps.length,
  };
}
