import { createClient, isSupabaseConfigured } from "./server";

export interface ClientReport {
  clientId: string;
  clientName: string;
  minutes: number;
  billableMinutes: number;
  billableAmount: number;
  tasksCompleted: number;
  activeCases: number;
  closedCases: number;
  docsReceived: number;
  requests: number;
}

export interface ReportPeriod {
  start: string;
  end: string;
  label: string;
}

const ACTIVE_CASE_STATES = ["nouveau", "en_cours", "en_attente_client", "a_completer", "bloque", "a_valider"];
const RECEIVED_DOC_STATES = ["recu", "valide"];

export function currentMonthPeriod(): ReportPeriod {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    label: new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(now),
  };
}

/** Synthèse mensuelle par client (mois en cours). Null en configuration production. */
export async function getReportOverview(): Promise<ClientReport[] | null> {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const period = currentMonthPeriod();

  const { data: clients } = await supabase.from("clients").select("id,name").eq("owner_id", user.id).order("name");
  const clientIds = (clients ?? []).map((c) => c.id);

  const [{ data: timeEntries }, { data: tasks }, { data: cases }, { data: documents }, { data: requests }] =
    await Promise.all([
      supabase
        .from("time_entries")
        .select("client_id,duration_minutes,billable,hourly_rate,date")
        .eq("owner_id", user.id)
        .gte("date", period.start)
        .lte("date", period.end),
      supabase
        .from("tasks")
        .select("client_id,status,completed_at")
        .eq("owner_id", user.id)
        .eq("status", "termine")
        .gte("completed_at", `${period.start}T00:00:00`)
        .lte("completed_at", `${period.end}T23:59:59`),
      supabase.from("hr_cases").select("client_id,status").eq("owner_id", user.id),
      supabase
        .from("documents")
        .select("client_id,status,created_at")
        .eq("owner_id", user.id)
        .gte("created_at", `${period.start}T00:00:00`)
        .lte("created_at", `${period.end}T23:59:59`),
      clientIds.length > 0
        ? supabase
            .from("client_requests")
            .select("client_id,created_at")
            .in("client_id", clientIds)
            .gte("created_at", `${period.start}T00:00:00`)
            .lte("created_at", `${period.end}T23:59:59`)
        : Promise.resolve({ data: [] as { client_id: string; created_at: string }[] }),
    ]);

  const reports = new Map<string, ClientReport>();
  for (const c of clients ?? []) {
    reports.set(c.id, {
      clientId: c.id,
      clientName: c.name,
      minutes: 0,
      billableMinutes: 0,
      billableAmount: 0,
      tasksCompleted: 0,
      activeCases: 0,
      closedCases: 0,
      docsReceived: 0,
      requests: 0,
    });
  }

  for (const t of timeEntries ?? []) {
    const r = t.client_id ? reports.get(t.client_id) : null;
    if (!r) continue;
    r.minutes += t.duration_minutes ?? 0;
    if (t.billable) {
      r.billableMinutes += t.duration_minutes ?? 0;
      r.billableAmount += ((t.duration_minutes ?? 0) / 60) * Number(t.hourly_rate ?? 0);
    }
  }
  for (const t of tasks ?? []) {
    const r = t.client_id ? reports.get(t.client_id) : null;
    if (r) r.tasksCompleted += 1;
  }
  for (const c of cases ?? []) {
    const r = c.client_id ? reports.get(c.client_id) : null;
    if (!r) continue;
    if (c.status === "termine" || c.status === "archive") r.closedCases += 1;
    else if (ACTIVE_CASE_STATES.includes(c.status)) r.activeCases += 1;
  }
  for (const d of documents ?? []) {
    const r = d.client_id ? reports.get(d.client_id) : null;
    if (r && RECEIVED_DOC_STATES.includes(d.status)) r.docsReceived += 1;
  }
  for (const req of requests ?? []) {
    const r = req.client_id ? reports.get(req.client_id) : null;
    if (r) r.requests += 1;
  }

  return Array.from(reports.values());
}

/** Rapport d'un seul client (mois en cours). Null si non connecté / introuvable. */
export async function getClientReport(clientId: string): Promise<{ report: ClientReport; period: ReportPeriod } | null> {
  const overview = await getReportOverview();
  if (!overview) return null;
  const report = overview.find((r) => r.clientId === clientId);
  if (!report) return null;
  return { report, period: currentMonthPeriod() };
}
