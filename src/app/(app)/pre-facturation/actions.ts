"use server";

import { redirect } from "next/navigation";
import { updatePreInvoiceStatusRecord } from "@/lib/supabase/billing-mutations";
import type { PreInvoiceStatus } from "@/lib/types";

export async function updatePreInvoiceStatusAction(id: string, status: PreInvoiceStatus) {
  const result = await updatePreInvoiceStatusRecord(id, status);
  if (!result.ok && result.reason === "unauthenticated") redirect("/login");
  return result;
}
