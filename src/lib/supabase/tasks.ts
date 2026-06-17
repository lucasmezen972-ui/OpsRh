import { createClient, isSupabaseConfigured } from "./server";
import type { Priority, TaskStatus, TaskType } from "@/lib/types";

export interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  client_id: string | null;
  client_name: string | null;
  hr_case_id: string | null;
  case_title: string | null;
  type: TaskType;
  priority: Priority;
  status: TaskStatus;
  due_date: string | null;
}

export interface TaskSuggestion {
  id: string;
  name: string;
  case_id: string | null;
  case_title: string | null;
  days: number;
}

export interface TaskBoard {
  tasks: TaskRow[];
  suggestions: TaskSuggestion[];
}

const MISSING_DOC_STATES = ["demande", "a_corriger", "expire"];

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

/** Liste des tâches ouvertes + relances suggérées. Null en mode démo. */
export async function getSupabaseTaskBoard(): Promise<TaskBoard | null> {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id,title,description,client_id,hr_case_id,type,priority,status,due_date")
    .eq("owner_id", user.id)
    .neq("status", "termine")
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw new Error(`Impossible de charger les tâches : ${error.message}`);

  const list = tasks ?? [];
  const clientIds = Array.from(new Set(list.map((t) => t.client_id).filter(Boolean))) as string[];
  const caseIds = Array.from(new Set(list.map((t) => t.hr_case_id).filter(Boolean))) as string[];

  const [{ data: clients }, { data: cases }, { data: checklists }] = await Promise.all([
    clientIds.length
      ? supabase.from("clients").select("id,name").in("id", clientIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    supabase.from("hr_cases").select("id,title").eq("owner_id", user.id),
    supabase.from("document_checklists").select("id,hr_case_id").eq("owner_id", user.id),
  ]);

  const clientName = new Map((clients ?? []).map((c) => [c.id, c.name]));
  const caseTitle = new Map((cases ?? []).map((c) => [c.id, c.title]));

  const taskRows: TaskRow[] = list.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    client_id: t.client_id,
    client_name: t.client_id ? clientName.get(t.client_id) ?? null : null,
    hr_case_id: t.hr_case_id,
    case_title: t.hr_case_id ? caseTitle.get(t.hr_case_id) ?? null : null,
    type: t.type as TaskType,
    priority: t.priority as Priority,
    status: t.status as TaskStatus,
    due_date: t.due_date,
  }));

  // Relances suggérées : pièces manquantes demandées depuis ≥ 5 jours.
  const suggestions: TaskSuggestion[] = [];
  const checklistCase = new Map<string, string | null>((checklists ?? []).map((c) => [c.id, c.hr_case_id]));
  const checklistIds = (checklists ?? []).map((c) => c.id);
  if (checklistIds.length > 0) {
    const { data: items } = await supabase
      .from("checklist_items")
      .select("id,checklist_id,name,status,created_at")
      .in("checklist_id", checklistIds)
      .in("status", MISSING_DOC_STATES);
    for (const item of items ?? []) {
      const days = daysSince(item.created_at);
      if (days >= 5) {
        const caseId = checklistCase.get(item.checklist_id) ?? null;
        suggestions.push({
          id: item.id,
          name: item.name,
          case_id: caseId,
          case_title: caseId ? caseTitle.get(caseId) ?? null : null,
          days,
        });
      }
    }
  }

  return { tasks: taskRows, suggestions };
}

/** Options dossiers (Supabase) pour les menus déroulants. Null en mode démo. */
export async function getSupabaseCaseOptions(): Promise<{ id: string; title: string; client_id: string }[] | null> {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("hr_cases")
    .select("id,title,client_id")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });
  return data ?? [];
}
