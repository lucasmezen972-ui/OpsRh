import {
  clientBillableAmount,
  clientMinutesThisMonth,
  getCase,
  getCases,
  getClient,
  getClients,
  getTimeEntries,
  totalBillableThisMonth,
  totalMinutesThisMonth,
} from "@/lib/data";
import { getSupabaseTimeView, type TimeView } from "@/lib/supabase/time";
import { getSupabaseClientOptions } from "@/lib/supabase/cases";
import { getSupabaseCaseOptions } from "@/lib/supabase/tasks";
import { TimeViewClient } from "./time-view";

export default async function TempsPage() {
  const supabaseView = await getSupabaseTimeView();
  const isDemo = supabaseView === null;

  let view: TimeView;
  let clientOptions: { id: string; name: string }[];
  let caseOptions: { id: string; title: string }[];

  if (supabaseView) {
    view = supabaseView;
    const [clients, cases] = await Promise.all([getSupabaseClientOptions(), getSupabaseCaseOptions()]);
    clientOptions = clients ?? [];
    caseOptions = (cases ?? []).map((c) => ({ id: c.id, title: c.title }));
  } else {
    const entries = [...getTimeEntries()].sort((a, b) => b.date.localeCompare(a.date));
    view = {
      entries: entries.map((t) => ({
        id: t.id,
        date: t.date,
        client_name: t.client_id ? getClient(t.client_id)?.name ?? null : null,
        case_title: t.hr_case_id ? getCase(t.hr_case_id)?.title ?? null : null,
        duration_minutes: t.duration_minutes,
        billable: t.billable,
        description: t.description,
      })),
      totalMinutes: totalMinutesThisMonth(),
      totalBillable: totalBillableThisMonth(),
      nonBillableMinutes: getTimeEntries()
        .filter((t) => !t.billable)
        .reduce((sum, t) => sum + t.duration_minutes, 0),
      entryCount: getTimeEntries().length,
      perClient: getClients().map((c) => ({
        id: c.id,
        name: c.name,
        sector: c.sector,
        minutes: clientMinutesThisMonth(c.id),
        billable: clientBillableAmount(c.id),
      })),
    };
    clientOptions = getClients().map((c) => ({ id: c.id, name: c.name }));
    caseOptions = getCases().map((c) => ({ id: c.id, title: c.title }));
  }

  return <TimeViewClient view={view} clientOptions={clientOptions} caseOptions={caseOptions} isDemo={isDemo} />;
}
