import { createClient, isSupabaseConfigured } from "./server";
import type { CaseStatus, CaseType, Priority } from "@/lib/types";

export interface CaseListItem {
  id: string;
  title: string;
  person_name: string | null;
  case_type: CaseType;
  status: CaseStatus;
  priority: Priority;
  due_date: string | null;
  client_name: string | null;
  received_docs: number;
  total_docs: number;
  missing_docs: number;
  open_tasks: number;
}

const MISSING_DOC_STATES = ["demande", "a_corriger", "expire"];
const RECEIVED_DOC_STATES = ["recu", "valide"];

/**
 * Renvoie null si Supabase n'est pas configuré ou si aucun utilisateur n'est
 * connecté, sans repli vers des données fictives.
 */
export async function getSupabaseCaseList(): Promise<CaseListItem[] | null> {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: cases, error } = await supabase
    .from("hr_cases")
    .select("id,client_id,title,person_name,case_type,status,priority,due_date,updated_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`Impossible de charger les dossiers : ${error.message}`);
  if (!cases?.length) return [];

  const caseIds = cases.map((c) => c.id);
  const clientIds = Array.from(new Set(cases.map((c) => c.client_id).filter(Boolean))) as string[];

  const [{ data: clients }, { data: checklists }, { data: tasks }] = await Promise.all([
    clientIds.length
      ? supabase.from("clients").select("id,name").in("id", clientIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    supabase.from("document_checklists").select("id,hr_case_id").in("hr_case_id", caseIds),
    supabase.from("tasks").select("hr_case_id,status").in("hr_case_id", caseIds),
  ]);

  const clientNameById = new Map((clients ?? []).map((c) => [c.id, c.name]));

  // checklist_id -> hr_case_id
  const checklistCaseById = new Map<string, string>();
  for (const cl of checklists ?? []) {
    if (cl.hr_case_id) checklistCaseById.set(cl.id, cl.hr_case_id);
  }
  const checklistIds = (checklists ?? []).map((cl) => cl.id);

  const received = new Map<string, number>();
  const total = new Map<string, number>();
  const missing = new Map<string, number>();

  if (checklistIds.length > 0) {
    const { data: items, error: itemsError } = await supabase
      .from("checklist_items")
      .select("checklist_id,status")
      .in("checklist_id", checklistIds);
    if (itemsError) throw new Error(`Impossible de charger les pièces : ${itemsError.message}`);

    for (const item of items ?? []) {
      const caseId = checklistCaseById.get(item.checklist_id);
      if (!caseId) continue;
      total.set(caseId, (total.get(caseId) ?? 0) + 1);
      if (RECEIVED_DOC_STATES.includes(item.status)) received.set(caseId, (received.get(caseId) ?? 0) + 1);
      if (MISSING_DOC_STATES.includes(item.status)) missing.set(caseId, (missing.get(caseId) ?? 0) + 1);
    }
  }

  const openTasks = new Map<string, number>();
  for (const task of tasks ?? []) {
    if (task.hr_case_id && task.status !== "termine") {
      openTasks.set(task.hr_case_id, (openTasks.get(task.hr_case_id) ?? 0) + 1);
    }
  }

  return cases.map((c) => ({
    id: c.id,
    title: c.title,
    person_name: c.person_name,
    case_type: c.case_type as CaseType,
    status: c.status as CaseStatus,
    priority: c.priority as Priority,
    due_date: c.due_date,
    client_name: c.client_id ? clientNameById.get(c.client_id) ?? null : null,
    received_docs: received.get(c.id) ?? 0,
    total_docs: total.get(c.id) ?? 0,
    missing_docs: missing.get(c.id) ?? 0,
    open_tasks: openTasks.get(c.id) ?? 0,
  }));
}

/** Liste minimale des clients (Supabase) pour alimenter un menu déroulant. Null en configuration production. */
export async function getSupabaseClientOptions(): Promise<{ id: string; name: string }[] | null> {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("clients").select("id,name").eq("owner_id", user.id).order("name");
  return data ?? [];
}
