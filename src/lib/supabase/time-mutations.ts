import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "./server";

export type MutationResult =
  | { ok: true }
  | { ok: false; reason: "configuration" | "unauthenticated" | "validation" | "database"; message: string };

export type CreateTimeEntryInput = {
  client_id: string;
  hr_case_id?: string | null;
  date?: string | null;
  duration_minutes: number;
  description?: string | null;
  billable: boolean;
  hourly_rate?: number | null;
};

function clean(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function ownerClient() {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return { supabase: null, user: null } as const;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user } as const;
}

export async function createTimeEntryRecord(input: CreateTimeEntryInput): Promise<MutationResult> {
  const { supabase, user } = await ownerClient();
  if (!supabase) return { ok: false, reason: "configuration", message: "Supabase n'est pas configuré." };
  if (!user) return { ok: false, reason: "unauthenticated", message: "Vous devez être connecté." };

  if (!clean(input.client_id)) return { ok: false, reason: "validation", message: "Le client est obligatoire." };
  if (!clean(input.date)) return { ok: false, reason: "validation", message: "La date est obligatoire." };
  if (!input.duration_minutes || input.duration_minutes <= 0)
    return { ok: false, reason: "validation", message: "La durée doit être supérieure à 0." };
  if (input.hourly_rate != null && input.hourly_rate < 0)
    return { ok: false, reason: "validation", message: "Le tarif horaire ne peut pas être négatif." };

  const { error } = await supabase.from("time_entries").insert({
    owner_id: user.id,
    client_id: input.client_id,
    hr_case_id: clean(input.hr_case_id),
    date: clean(input.date),
    duration_minutes: input.duration_minutes,
    description: clean(input.description),
    billable: input.billable,
    hourly_rate: input.hourly_rate ?? null,
  });
  if (error) return { ok: false, reason: "database", message: error.message };

  await supabase.from("activity_logs").insert({
    owner_id: user.id,
    actor_id: user.id,
    client_id: input.client_id,
    hr_case_id: clean(input.hr_case_id),
    action_type: "temps_ajoute",
    description: `${Math.round((input.duration_minutes / 60) * 10) / 10}h saisies`,
  });

  revalidatePath("/temps");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteTimeEntryRecord(id: string): Promise<MutationResult> {
  const { supabase, user } = await ownerClient();
  if (!supabase) return { ok: false, reason: "configuration", message: "Supabase n'est pas configuré." };
  if (!user) return { ok: false, reason: "unauthenticated", message: "Non connecté." };

  const { error } = await supabase.from("time_entries").delete().eq("id", id).eq("owner_id", user.id);
  if (error) return { ok: false, reason: "database", message: error.message };

  revalidatePath("/temps");
  return { ok: true };
}
