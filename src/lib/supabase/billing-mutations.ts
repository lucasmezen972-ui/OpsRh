import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "./server";
import type { PreInvoiceStatus } from "@/lib/types";

export type MutationResult =
  | { ok: true }
  | { ok: false; reason: "configuration" | "unauthenticated" | "database"; message: string };

async function ownerClient() {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return { supabase: null, user: null } as const;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user } as const;
}

export async function updatePreInvoiceStatusRecord(id: string, status: PreInvoiceStatus): Promise<MutationResult> {
  const { supabase, user } = await ownerClient();
  if (!supabase) return { ok: false, reason: "configuration", message: "Supabase n'est pas configuré." };
  if (!user) return { ok: false, reason: "unauthenticated", message: "Non connecté." };

  const { error } = await supabase
    .from("pre_invoices")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return { ok: false, reason: "database", message: error.message };

  revalidatePath("/pre-facturation");
  return { ok: true };
}
