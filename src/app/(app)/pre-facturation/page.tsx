import {
  clientBillableAmount,
  clientMinutesThisMonth,
  getClient,
  getClients,
  getPreInvoices,
  totalBillableThisMonth,
} from "@/lib/data";
import { getSupabasePreInvoiceBoard, type PreInvoiceBoard } from "@/lib/supabase/billing";
import { BillingView } from "./billing-view";

export default async function PreFacturationPage() {
  const supabaseBoard = await getSupabasePreInvoiceBoard();
  const isDemo = supabaseBoard === null;

  const board: PreInvoiceBoard = supabaseBoard ?? {
    rows: getPreInvoices().map((p) => ({
      id: p.id,
      client_name: getClient(p.client_id)?.name ?? null,
      period_start: p.period_start,
      period_end: p.period_end,
      subtotal: p.subtotal,
      total: p.total,
      status: p.status,
      notes: p.notes,
    })),
    totalBillable: totalBillableThisMonth(),
    perClient: getClients().map((c) => ({
      id: c.id,
      name: c.name,
      hourly_rate: 65,
      monthly_retainer: null,
      minutes: clientMinutesThisMonth(c.id),
      billable: clientBillableAmount(c.id),
    })),
  };

  return <BillingView board={board} isDemo={isDemo} />;
}
