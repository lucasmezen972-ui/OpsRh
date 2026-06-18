import { createClient, isSupabaseConfigured } from "./server";
import type {
  ActivityLog,
  ClientContact,
  Client,
  DocumentItem,
  HrCase,
  PreInvoice,
  Task,
  TimeEntry,
  ChecklistItem,
  DocumentChecklist,
  Comment,
  GeneratedEmail,
} from "@/lib/types";

const ACTIVE_CASE_STATES = ["nouveau", "en_cours", "en_attente_client", "a_completer", "bloque", "a_valider"];
const MISSING_DOC_STATES = ["demande", "a_corriger", "expire"];

function firstDayOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

export interface ClientDetail {
  client: Client;
  contacts: ClientContact[];
  cases: HrCase[];
  documents: DocumentItem[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  preInvoices: PreInvoice[];
  activity: ActivityLog[];
  stats: { activeCases: number; missingDocs: number; minutes: number; billable: number };
}

export type DetailResult<T> = { status: "demo" } | { status: "not_found" } | { status: "ok"; detail: T };

async function ownerClient() {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return { supabase: null, user: null } as const;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user } as const;
}

export async function getSupabaseClientDetail(id: string): Promise<DetailResult<ClientDetail>> {
  const { supabase, user } = await ownerClient();
  if (!supabase || !user) return { status: "demo" };

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!client) return { status: "not_found" };

  const [
    { data: contacts },
    { data: cases },
    { data: documents },
    { data: tasks },
    { data: timeEntries },
    { data: preInvoices },
    { data: activity },
    { data: checklists },
  ] = await Promise.all([
    supabase.from("client_contacts").select("*").eq("client_id", id),
    supabase.from("hr_cases").select("*").eq("client_id", id).order("updated_at", { ascending: false }),
    supabase.from("documents").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("tasks").select("*").eq("client_id", id).order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("time_entries").select("*").eq("client_id", id).order("date", { ascending: false }),
    supabase.from("pre_invoices").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("activity_logs").select("*").eq("client_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("document_checklists").select("id").eq("client_id", id),
  ]);

  const checklistIds = (checklists ?? []).map((c) => c.id);
  let missingDocs = 0;
  if (checklistIds.length > 0) {
    const { count } = await supabase
      .from("checklist_items")
      .select("*", { count: "exact", head: true })
      .in("checklist_id", checklistIds)
      .in("status", MISSING_DOC_STATES);
    missingDocs = count ?? 0;
  }

  const firstDay = firstDayOfCurrentMonth();
  const entries = (timeEntries ?? []) as TimeEntry[];
  let minutes = 0;
  let billable = 0;
  for (const t of entries) {
    if (t.date >= firstDay) {
      minutes += t.duration_minutes;
      if (t.billable) billable += (t.duration_minutes / 60) * Number(t.hourly_rate ?? 0);
    }
  }

  const activeCases = ((cases ?? []) as HrCase[]).filter((c) => ACTIVE_CASE_STATES.includes(c.status)).length;

  return {
    status: "ok",
    detail: {
      client: client as Client,
      contacts: (contacts ?? []) as ClientContact[],
      cases: (cases ?? []) as HrCase[],
      documents: (documents ?? []) as DocumentItem[],
      tasks: (tasks ?? []) as Task[],
      timeEntries: entries,
      preInvoices: (preInvoices ?? []) as PreInvoice[],
      activity: (activity ?? []) as ActivityLog[],
      stats: { activeCases, missingDocs, minutes, billable },
    },
  };
}

export interface CaseDetail {
  hrCase: HrCase;
  client: Client | null;
  checklists: { checklist: DocumentChecklist; items: ChecklistItem[] }[];
  tasks: Task[];
  documents: DocumentItem[];
  timeEntries: TimeEntry[];
  emails: GeneratedEmail[];
  comments: Comment[];
  activity: ActivityLog[];
  stats: { received: number; total: number; missing: number; minutes: number };
}

export async function getSupabaseCaseDetail(id: string): Promise<DetailResult<CaseDetail>> {
  const { supabase, user } = await ownerClient();
  if (!supabase || !user) return { status: "demo" };

  const { data: hrCase } = await supabase
    .from("hr_cases")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!hrCase) return { status: "not_found" };

  const [
    { data: client },
    { data: checklists },
    { data: tasks },
    { data: documents },
    { data: timeEntries },
    { data: emails },
    { data: comments },
    { data: activity },
  ] = await Promise.all([
    hrCase.client_id
      ? supabase.from("clients").select("*").eq("id", hrCase.client_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("document_checklists").select("*").eq("hr_case_id", id),
    supabase.from("tasks").select("*").eq("hr_case_id", id).order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("documents").select("*").eq("hr_case_id", id).order("created_at", { ascending: false }),
    supabase.from("time_entries").select("*").eq("hr_case_id", id).order("date", { ascending: false }),
    supabase.from("generated_emails").select("*").eq("hr_case_id", id).order("created_at", { ascending: false }),
    supabase.from("comments").select("*").eq("hr_case_id", id).order("created_at", { ascending: false }),
    supabase.from("activity_logs").select("*").eq("hr_case_id", id).order("created_at", { ascending: false }).limit(50),
  ]);

  const checklistList = (checklists ?? []) as DocumentChecklist[];
  const checklistIds = checklistList.map((c) => c.id);
  let items: ChecklistItem[] = [];
  if (checklistIds.length > 0) {
    const { data } = await supabase
      .from("checklist_items")
      .select("*")
      .in("checklist_id", checklistIds)
      .order("created_at");
    items = (data ?? []) as ChecklistItem[];
  }

  const grouped = checklistList.map((checklist) => ({
    checklist,
    items: items.filter((i) => i.checklist_id === checklist.id),
  }));

  const received = items.filter((i) => i.status === "recu" || i.status === "valide").length;
  const missing = items.filter((i) => MISSING_DOC_STATES.includes(i.status)).length;
  const minutes = ((timeEntries ?? []) as TimeEntry[]).reduce((s, t) => s + t.duration_minutes, 0);

  return {
    status: "ok",
    detail: {
      hrCase: hrCase as HrCase,
      client: (client as Client) ?? null,
      checklists: grouped,
      tasks: (tasks ?? []) as Task[],
      documents: (documents ?? []) as DocumentItem[],
      timeEntries: (timeEntries ?? []) as TimeEntry[],
      emails: (emails ?? []) as GeneratedEmail[],
      comments: (comments ?? []) as Comment[],
      activity: (activity ?? []) as ActivityLog[],
      stats: { received, total: items.length, missing, minutes },
    },
  };
}
