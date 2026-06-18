import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "./server";
import type { CaseStatus, CaseType, Priority } from "@/lib/types";

export type CreateCaseInput = {
  title: string;
  client_id: string;
  person_name?: string | null;
  case_type?: CaseType;
  description?: string | null;
  status?: CaseStatus;
  priority?: Priority;
  due_date?: string | null;
  internal_notes?: string | null;
  expected_documents?: string | null; // un nom de pièce par ligne (optionnel)
};

export type CreateCaseResult =
  | { ok: true; caseId: string }
  | { ok: false; reason: "demo_mode" | "unauthenticated" | "validation" | "database"; message: string };

function clean(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createCaseRecord(input: CreateCaseInput): Promise<CreateCaseResult> {
  const supabase = createClient();

  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, reason: "demo_mode", message: "Supabase n'est pas configuré. Le dossier n'a pas été enregistré." };
  }

  const title = clean(input.title);
  const clientId = clean(input.client_id);
  if (!title) return { ok: false, reason: "validation", message: "Le titre du dossier est obligatoire." };
  if (!clientId) return { ok: false, reason: "validation", message: "Le client associé est obligatoire." };

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, reason: "unauthenticated", message: "Vous devez être connecté pour créer un dossier." };
  }

  const { data: hrCase, error: caseError } = await supabase
    .from("hr_cases")
    .insert({
      owner_id: user.id,
      client_id: clientId,
      title,
      person_name: clean(input.person_name),
      case_type: input.case_type ?? "autre",
      description: clean(input.description),
      status: input.status ?? "nouveau",
      priority: input.priority ?? "normale",
      due_date: clean(input.due_date),
      internal_notes: clean(input.internal_notes),
    })
    .select("id")
    .single();

  if (caseError || !hrCase) {
    return { ok: false, reason: "database", message: caseError?.message ?? "Impossible de créer le dossier." };
  }

  // Checklist initiale optionnelle.
  const expected = clean(input.expected_documents);
  if (expected) {
    const names = expected
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (names.length > 0) {
      const { data: checklist } = await supabase
        .from("document_checklists")
        .insert({ owner_id: user.id, client_id: clientId, hr_case_id: hrCase.id, title: "Documents attendus" })
        .select("id")
        .single();
      if (checklist) {
        await supabase.from("checklist_items").insert(
          names.map((name) => ({ checklist_id: checklist.id, name, required: true, status: "demande" as const }))
        );
      }
    }
  }

  await supabase.from("activity_logs").insert({
    owner_id: user.id,
    client_id: clientId,
    hr_case_id: hrCase.id,
    action_type: "dossier_cree",
    description: `Dossier créé : ${title}`,
    actor_id: user.id,
  });

  revalidatePath("/dossiers");
  revalidatePath("/dashboard");

  return { ok: true, caseId: hrCase.id };
}
