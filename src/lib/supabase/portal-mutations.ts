import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "./server";
import type { ClientRequestType, Priority } from "@/lib/types";

export type MutationResult =
  | { ok: true }
  | { ok: false; reason: "demo_mode" | "unauthenticated" | "validation" | "database"; message: string };

export type CreateClientRequestInput = {
  client_id: string;
  title: string;
  type?: ClientRequestType;
  priority?: Priority;
  description?: string | null;
};

function clean(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createClientRequestRecord(input: CreateClientRequestInput): Promise<MutationResult> {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return { ok: false, reason: "demo_mode", message: "Mode démo." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated", message: "Non connecté." };

  const clientId = clean(input.client_id);
  const title = clean(input.title);
  if (!clientId) return { ok: false, reason: "validation", message: "Client manquant." };
  if (!title) return { ok: false, reason: "validation", message: "L'objet de la demande est obligatoire." };

  const { error } = await supabase.from("client_requests").insert({
    client_id: clientId,
    created_by: user.id,
    title,
    type: input.type ?? "autre",
    priority: input.priority ?? "normale",
    description: clean(input.description),
    status: "nouvelle",
  });
  if (error) return { ok: false, reason: "database", message: error.message };

  revalidatePath("/portail");
  return { ok: true };
}
