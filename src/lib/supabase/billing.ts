import { createClient, isSupabaseConfigured } from "./server";
import type { PreInvoiceStatus } from "@/lib/types";

export interface PreInvoiceRow {
  id: string;
  client_name: string | null;
  period_start: string;
  period_end: string;
  subtotal: number;
  total: number;
  status: PreInvoiceStatus;
  notes: string | null;
}

export interface ClientBilling {
  id: string;
  name: string;
  hourly_rate: number | null;
  monthly_retainer: number | null;
  minutes: number;
  billable: number;
}

export interface PreInvoiceBoard {
  rows: PreInvoiceRow[];
  totalBillable: number;
  perClient: ClientBilling[];
}

function firstDayOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

export async function getSupabasePreInvoiceBoard(): Promise<PreInvoiceBoard | null> {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const firstDay = firstDayOfCurrentMonth();
  const [{ data: preInvoices }, { data: clients }, { data: settings }, { data: timeEntries }] = await Promise.all([
    supabase.from("pre_invoices").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }),
    supabase.from("clients").select("id,name").eq("owner_id", user.id).order("name"),
    supabase.from("billing_settings").select("client_id,hourly_rate,monthly_retainer").eq("owner_id", user.id),
    supabase
      .from("time_entries")
      .select("client_id,duration_minutes,billable,hourly_rate,date")
      .eq("owner_id", user.id)
      .gte("date", firstDay),
  ]);

  const clientName = new Map((clients ?? []).map((c) => [c.id, c.name]));
  const settingByClient = new Map((settings ?? []).map((s) => [s.client_id, s]));

  const minutesByClient = new Map<string, number>();
  const billableByClient = new Map<string, number>();
  let totalBillable = 0;
  for (const t of timeEntries ?? []) {
    if (t.client_id) {
      minutesByClient.set(t.client_id, (minutesByClient.get(t.client_id) ?? 0) + (t.duration_minutes ?? 0));
      if (t.billable) {
        const amount = ((t.duration_minutes ?? 0) / 60) * Number(t.hourly_rate ?? 0);
        billableByClient.set(t.client_id, (billableByClient.get(t.client_id) ?? 0) + amount);
        totalBillable += amount;
      }
    }
  }

  return {
    rows: (preInvoices ?? []).map((p) => ({
      id: p.id,
      client_name: clientName.get(p.client_id) ?? null,
      period_start: p.period_start,
      period_end: p.period_end,
      subtotal: Number(p.subtotal),
      total: Number(p.total),
      status: p.status as PreInvoiceStatus,
      notes: p.notes,
    })),
    totalBillable,
    perClient: (clients ?? []).map((c) => {
      const s = settingByClient.get(c.id);
      return {
        id: c.id,
        name: c.name,
        hourly_rate: s?.hourly_rate != null ? Number(s.hourly_rate) : null,
        monthly_retainer: s?.monthly_retainer != null ? Number(s.monthly_retainer) : null,
        minutes: minutesByClient.get(c.id) ?? 0,
        billable: billableByClient.get(c.id) ?? 0,
      };
    }),
  };
}
