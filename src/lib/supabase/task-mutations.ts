import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "./server";
import type { Priority, TaskStatus, TaskType } from "@/lib/types";

export type MutationResult =
  | { ok: true }
  | { ok: false; reason: "configuration" | "unauthenticated" | "validation" | "database"; message: string };

export type CreateTaskInput = {
  title: string;
  client_id?: string | null;
  hr_case_id?: string | null;
  description?: string | null;
  type?: TaskType;
  status?: TaskStatus;
  priority?: Priority;
  due_date?: string | null;
  estimated_minutes?: number | null;
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

export async function createTaskRecord(input: CreateTaskInput): Promise<MutationResult> {
  const { supabase, user } = await ownerClient();
  if (!supabase) return { ok: false, reason: "configuration", message: "Supabase n'est pas configuré." };
  if (!user) return { ok: false, reason: "unauthenticated", message: "Vous devez être connecté." };

  const title = clean(input.title);
  if (!title) return { ok: false, reason: "validation", message: "Le titre est obligatoire." };

  const { error } = await supabase.from("tasks").insert({
    owner_id: user.id,
    client_id: clean(input.client_id),
    hr_case_id: clean(input.hr_case_id),
    title,
    description: clean(input.description),
    type: input.type ?? "autre",
    status: input.status ?? "a_faire",
    priority: input.priority ?? "normale",
    due_date: clean(input.due_date),
    estimated_minutes: input.estimated_minutes ?? null,
  });
  if (error) return { ok: false, reason: "database", message: error.message };

  revalidatePath("/taches");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function completeTaskRecord(id: string): Promise<MutationResult> {
  const { supabase, user } = await ownerClient();
  if (!supabase) return { ok: false, reason: "configuration", message: "Supabase n'est pas configuré." };
  if (!user) return { ok: false, reason: "unauthenticated", message: "Non connecté." };

  const { data, error } = await supabase
    .from("tasks")
    .update({ status: "termine", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("title,client_id,hr_case_id")
    .single();
  if (error) return { ok: false, reason: "database", message: error.message };

  await supabase.from("activity_logs").insert({
    owner_id: user.id,
    actor_id: user.id,
    client_id: data?.client_id ?? null,
    hr_case_id: data?.hr_case_id ?? null,
    action_type: "tache_terminee",
    description: `Tâche terminée : ${data?.title ?? ""}`,
  });

  revalidatePath("/taches");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function postponeTaskRecord(id: string, days = 1): Promise<MutationResult> {
  const { supabase, user } = await ownerClient();
  if (!supabase) return { ok: false, reason: "configuration", message: "Supabase n'est pas configuré." };
  if (!user) return { ok: false, reason: "unauthenticated", message: "Non connecté." };

  const { data } = await supabase.from("tasks").select("due_date").eq("id", id).eq("owner_id", user.id).single();
  const base = data?.due_date ? new Date(data.due_date) : new Date();
  base.setDate(base.getDate() + days);

  const { error } = await supabase
    .from("tasks")
    .update({ due_date: base.toISOString().slice(0, 10), status: "a_faire", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return { ok: false, reason: "database", message: error.message };

  revalidatePath("/taches");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteTaskRecord(id: string): Promise<MutationResult> {
  const { supabase, user } = await ownerClient();
  if (!supabase) return { ok: false, reason: "configuration", message: "Supabase n'est pas configuré." };
  if (!user) return { ok: false, reason: "unauthenticated", message: "Non connecté." };

  const { error } = await supabase.from("tasks").delete().eq("id", id).eq("owner_id", user.id);
  if (error) return { ok: false, reason: "database", message: error.message };

  revalidatePath("/taches");
  revalidatePath("/dashboard");
  return { ok: true };
}
