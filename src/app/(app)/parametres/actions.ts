"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type SettingsActionState = { ok: boolean; message: string };

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

async function authenticatedClient() {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return { supabase: null, user: null } as const;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user } as const;
}

export async function updateProfileAction(_state: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const { supabase, user } = await authenticatedClient();
  if (!supabase) return { ok: false, message: "Supabase n'est pas configuré : enregistrement impossible." };
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: value(formData, "full_name"),
      company_name: value(formData, "company_name") || null,
      email_signature: value(formData, "signature") || null,
    })
    .eq("id", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/parametres");
  revalidatePath("/", "layout");
  return { ok: true, message: "Profil enregistré." };
}

export async function updateUserSettingsAction(
  _state: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const { supabase, user } = await authenticatedClient();
  if (!supabase) return { ok: false, message: "Supabase n'est pas configuré : enregistrement impossible." };
  if (!user) redirect("/login");

  const defaultRate = Number(value(formData, "default_hourly_rate"));
  if (!Number.isFinite(defaultRate) || defaultRate < 0) {
    return { ok: false, message: "Le tarif horaire par défaut doit être positif ou nul." };
  }

  const { error } = await supabase.from("user_settings").upsert({
    owner_id: user.id,
    default_hourly_rate: defaultRate,
    currency: value(formData, "currency") || "EUR",
    pre_invoice_mentions: value(formData, "pre_invoice_mentions") || null,
    portal_enabled: formData.get("portal_enabled") != null,
    portal_welcome_message: value(formData, "portal_welcome_message") || null,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/parametres");
  return { ok: true, message: "Paramètres enregistrés." };
}
