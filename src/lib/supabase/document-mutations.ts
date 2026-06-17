import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "./server";
import type { DocumentStatus, DocumentType } from "@/lib/types";

export type MutationResult =
  | { ok: true }
  | { ok: false; reason: "demo_mode" | "unauthenticated" | "validation" | "database"; message: string };

export type CreateDocumentInput = {
  name: string;
  client_id?: string | null;
  hr_case_id?: string | null;
  document_type?: DocumentType;
  status?: DocumentStatus;
  expiration_date?: string | null;
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

export async function createDocumentRecord(input: CreateDocumentInput): Promise<MutationResult> {
  const { supabase, user } = await ownerClient();
  if (!supabase) return { ok: false, reason: "demo_mode", message: "Supabase n'est pas configuré." };
  if (!user) return { ok: false, reason: "unauthenticated", message: "Vous devez être connecté." };

  const name = clean(input.name);
  if (!name) return { ok: false, reason: "validation", message: "Le nom du document est obligatoire." };

  const { error } = await supabase.from("documents").insert({
    owner_id: user.id,
    client_id: clean(input.client_id),
    hr_case_id: clean(input.hr_case_id),
    name,
    document_type: input.document_type ?? "autre",
    status: input.status ?? "recu",
    expiration_date: clean(input.expiration_date),
    uploaded_by: user.id,
  });
  if (error) return { ok: false, reason: "database", message: error.message };

  await supabase.from("activity_logs").insert({
    owner_id: user.id,
    actor_id: user.id,
    client_id: clean(input.client_id),
    hr_case_id: clean(input.hr_case_id),
    action_type: "document_ajoute",
    description: `Document ajouté : ${name}`,
  });

  revalidatePath("/documents");
  return { ok: true };
}

/** Met à jour le statut d'une pièce de checklist (relancer / reçu / validé). */
export async function setChecklistItemStatusRecord(itemId: string, status: DocumentStatus): Promise<MutationResult> {
  const { supabase, user } = await ownerClient();
  if (!supabase) return { ok: false, reason: "demo_mode", message: "Mode démo." };
  if (!user) return { ok: false, reason: "unauthenticated", message: "Non connecté." };

  // RLS garantit que la pièce appartient à une checklist de l'utilisateur.
  const { error } = await supabase
    .from("checklist_items")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", itemId);
  if (error) return { ok: false, reason: "database", message: error.message };

  revalidatePath("/documents");
  return { ok: true };
}
