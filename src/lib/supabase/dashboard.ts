import { createClient, isSupabaseConfigured } from "./server";

export interface DashboardTask {
  id: string;
  title: string;
  priority: string;
  type: string;
  client_name: string | null;
  case_title: string | null;
  due_date: string | null;
  status: string;
}

export interface DashboardAlert {
  id: string;
  title: string;
  detail: string;
  href: string;
}

export interface DashboardActivity {
  id: string;
  action_type: string;
  description: string;
  client_name: string | null;
  created_at: string;
}

export interface DashboardData {
  stats: {
    todayTasks: number;
    overdueTasks: number;
    missingDocs: number;
    blockedCases: number;
    relances: number;
    minutesThisMonth: number;
    billableThisMonth: number;
  };
  today: DashboardTask[];
  alerts: DashboardAlert[];
  activity: DashboardActivity[];
}

const MISSING_DOC_STATES = ["demande", "a_corriger", "expire"];

function firstDayOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}
function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

/** Données du tableau de bord. Null en mode démo. */
export async function getSupabaseDashboard(): Promise<DashboardData | null> {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);
  const firstDay = firstDayOfCurrentMonth();

  const [
    { data: clients },
    { data: cases },
    { data: tasks },
    { data: checklists },
    { data: timeEntries },
    { data: activity },
  ] = await Promise.all([
    supabase.from("clients").select("id,name").eq("owner_id", user.id),
    supabase.from("hr_cases").select("id,title,client_id,status").eq("owner_id", user.id),
    supabase
      .from("tasks")
      .select("id,title,client_id,hr_case_id,type,priority,status,due_date")
      .eq("owner_id", user.id)
      .neq("status", "termine"),
    supabase.from("document_checklists").select("id,hr_case_id").eq("owner_id", user.id),
    supabase
      .from("time_entries")
      .select("duration_minutes,billable,hourly_rate,date")
      .eq("owner_id", user.id)
      .gte("date", firstDay),
    supabase
      .from("activity_logs")
      .select("id,action_type,description,client_id,created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const clientName = new Map((clients ?? []).map((c) => [c.id, c.name]));
  const caseById = new Map((cases ?? []).map((c) => [c.id, c]));
  const openTasks = tasks ?? [];

  // Pièces manquantes (checklist items) + suggestions d'alerte
  const checklistCase = new Map((checklists ?? []).map((c) => [c.id, c.hr_case_id]));
  const checklistIds = (checklists ?? []).map((c) => c.id);
  let missingItems: { id: string; name: string; checklist_id: string; created_at: string }[] = [];
  if (checklistIds.length > 0) {
    const { data } = await supabase
      .from("checklist_items")
      .select("id,name,checklist_id,created_at,status")
      .in("checklist_id", checklistIds)
      .in("status", MISSING_DOC_STATES);
    missingItems = data ?? [];
  }

  const todayTasks = openTasks.filter((t) => t.due_date != null && t.due_date <= today);
  const overdueTasks = openTasks.filter((t) => t.status === "en_retard" || (t.due_date != null && t.due_date < today));
  const relances = openTasks.filter((t) => t.type === "relance_client");
  const blockedCases = (cases ?? []).filter((c) => c.status === "bloque");

  let minutesThisMonth = 0;
  let billableThisMonth = 0;
  for (const t of timeEntries ?? []) {
    minutesThisMonth += t.duration_minutes ?? 0;
    if (t.billable) billableThisMonth += ((t.duration_minutes ?? 0) / 60) * Number(t.hourly_rate ?? 0);
  }

  const alerts: DashboardAlert[] = [];
  for (const item of missingItems) {
    const days = daysSince(item.created_at);
    if (days >= 5) {
      const caseId = checklistCase.get(item.checklist_id);
      const hrCase = caseId ? caseById.get(caseId) : null;
      alerts.push({
        id: `doc-${item.id}`,
        title: `Document manquant : ${item.name}`,
        detail: `Demandé depuis ${days} jours${hrCase ? ` — ${hrCase.title}` : ""}`,
        href: hrCase ? `/dossiers/${hrCase.id}` : "/documents",
      });
    }
  }
  for (const t of overdueTasks) {
    if (t.priority === "urgente" || t.priority === "haute") {
      const name = t.client_id ? clientName.get(t.client_id) : null;
      alerts.push({
        id: `task-${t.id}`,
        title: t.title,
        detail: `Tâche en retard${name ? ` — ${name}` : ""}`,
        href: "/taches",
      });
    }
  }
  for (const c of blockedCases) {
    const name = c.client_id ? clientName.get(c.client_id) : null;
    alerts.push({
      id: `case-${c.id}`,
      title: c.title,
      detail: `Dossier bloqué${name ? ` — ${name}` : ""}`,
      href: `/dossiers/${c.id}`,
    });
  }

  return {
    stats: {
      todayTasks: todayTasks.length,
      overdueTasks: overdueTasks.length,
      missingDocs: missingItems.length,
      blockedCases: blockedCases.length,
      relances: relances.length,
      minutesThisMonth,
      billableThisMonth,
    },
    today: todayTasks.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      type: t.type,
      client_name: t.client_id ? clientName.get(t.client_id) ?? null : null,
      case_title: t.hr_case_id ? caseById.get(t.hr_case_id)?.title ?? null : null,
      due_date: t.due_date,
      status: t.status,
    })),
    alerts,
    activity: (activity ?? []).map((log) => ({
      id: log.id,
      action_type: log.action_type,
      description: log.description,
      client_name: log.client_id ? clientName.get(log.client_id) ?? null : null,
      created_at: log.created_at,
    })),
  };
}
