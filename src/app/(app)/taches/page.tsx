import {
  getCase,
  getChecklists,
  getClient,
  getClients,
  getCases,
  missingChecklistItems,
  openTasks,
} from "@/lib/data";
import { getSupabaseTaskBoard, getSupabaseCaseOptions, type TaskRow, type TaskSuggestion } from "@/lib/supabase/tasks";
import { getSupabaseClientOptions } from "@/lib/supabase/cases";
import { daysSince } from "@/lib/utils";
import { TasksView } from "./tasks-view";

function bucket(rows: TaskRow[]) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    all: rows,
    today: rows.filter((t) => t.due_date != null && t.due_date <= today),
    overdue: rows.filter((t) => t.status === "en_retard" || (t.due_date != null && t.due_date < today)),
    relances: rows.filter((t) => t.type === "relance_client"),
  };
}

export default async function TasksPage() {
  const board = await getSupabaseTaskBoard();
  const isDemo = board === null;

  let rows: TaskRow[];
  let suggestions: TaskSuggestion[];
  let clientOptions: { id: string; name: string }[];
  let caseOptions: { id: string; title: string }[];

  if (board) {
    rows = board.tasks;
    suggestions = board.suggestions;
    const [clients, cases] = await Promise.all([getSupabaseClientOptions(), getSupabaseCaseOptions()]);
    clientOptions = clients ?? [];
    caseOptions = (cases ?? []).map((c) => ({ id: c.id, title: c.title }));
  } else {
    rows = openTasks().map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      client_id: t.client_id,
      client_name: t.client_id ? getClient(t.client_id)?.name ?? null : null,
      hr_case_id: t.hr_case_id,
      case_title: t.hr_case_id ? getCase(t.hr_case_id)?.title ?? null : null,
      type: t.type,
      priority: t.priority,
      status: t.status,
      due_date: t.due_date,
    }));
    suggestions = missingChecklistItems()
      .map((item) => {
        const checklist = getChecklists().find((c) => c.id === item.checklist_id);
        const hrCase = checklist?.hr_case_id ? getCase(checklist.hr_case_id) : null;
        return {
          id: item.id,
          name: item.name,
          case_id: hrCase?.id ?? null,
          case_title: hrCase?.title ?? null,
          days: daysSince(item.created_at),
        };
      })
      .filter((s) => s.days >= 5);
    clientOptions = getClients().map((c) => ({ id: c.id, name: c.name }));
    caseOptions = getCases().map((c) => ({ id: c.id, title: c.title }));
  }

  const buckets = bucket(rows);

  return (
    <TasksView
      all={buckets.all}
      today={buckets.today}
      overdue={buckets.overdue}
      relances={buckets.relances}
      suggestions={suggestions}
      clientOptions={clientOptions}
      caseOptions={caseOptions}
      isDemo={isDemo}
    />
  );
}
