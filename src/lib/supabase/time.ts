import { createClient, isSupabaseConfigured } from "./server";

export interface TimeEntryRow {
  id: string;
  date: string;
  client_name: string | null;
  case_title: string | null;
  duration_minutes: number;
  billable: boolean;
  description: string | null;
}

export interface ClientTimeSummary {
  id: string;
  name: string;
  sector: string | null;
  minutes: number;
  billable: number;
}

export interface TimeView {
  entries: TimeEntryRow[];
  totalMinutes: number;
  totalBillable: number;
  nonBillableMinutes: number;
  entryCount: number;
  perClient: ClientTimeSummary[];
}

function firstDayOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

/** Vue complète du temps passé. Null en configuration production. */
export async function getSupabaseTimeView(): Promise<TimeView | null> {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: entries, error }, { data: clients }, { data: cases }] = await Promise.all([
    supabase
      .from("time_entries")
      .select("id,client_id,hr_case_id,date,duration_minutes,billable,hourly_rate,description")
      .eq("owner_id", user.id)
      .order("date", { ascending: false }),
    supabase.from("clients").select("id,name,sector").eq("owner_id", user.id).order("name"),
    supabase.from("hr_cases").select("id,title").eq("owner_id", user.id),
  ]);
  if (error) throw new Error(`Impossible de charger le temps : ${error.message}`);

  const list = entries ?? [];
  const clientName = new Map((clients ?? []).map((c) => [c.id, c.name]));
  const caseTitle = new Map((cases ?? []).map((c) => [c.id, c.title]));
  const firstDay = firstDayOfCurrentMonth();

  const entryRows: TimeEntryRow[] = list.map((t) => ({
    id: t.id,
    date: t.date,
    client_name: t.client_id ? clientName.get(t.client_id) ?? null : null,
    case_title: t.hr_case_id ? caseTitle.get(t.hr_case_id) ?? null : null,
    duration_minutes: t.duration_minutes,
    billable: t.billable,
    description: t.description,
  }));

  let totalMinutes = 0;
  let totalBillable = 0;
  let nonBillableMinutes = 0;
  const minutesByClient = new Map<string, number>();
  const billableByClient = new Map<string, number>();

  for (const t of list) {
    const inMonth = t.date >= firstDay;
    if (inMonth) totalMinutes += t.duration_minutes;
    if (!t.billable) nonBillableMinutes += t.duration_minutes;
    if (inMonth && t.billable) {
      totalBillable += (t.duration_minutes / 60) * Number(t.hourly_rate ?? 0);
    }
    if (inMonth && t.client_id) {
      minutesByClient.set(t.client_id, (minutesByClient.get(t.client_id) ?? 0) + t.duration_minutes);
      if (t.billable) {
        billableByClient.set(
          t.client_id,
          (billableByClient.get(t.client_id) ?? 0) + (t.duration_minutes / 60) * Number(t.hourly_rate ?? 0)
        );
      }
    }
  }

  const perClient: ClientTimeSummary[] = (clients ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    sector: c.sector,
    minutes: minutesByClient.get(c.id) ?? 0,
    billable: billableByClient.get(c.id) ?? 0,
  }));

  return {
    entries: entryRows,
    totalMinutes,
    totalBillable,
    nonBillableMinutes,
    entryCount: list.length,
    perClient,
  };
}
