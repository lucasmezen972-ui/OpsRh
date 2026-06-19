import { createClient, isSupabaseConfigured } from "./server";

export interface UserSettings {
  default_hourly_rate: number;
  currency: string;
  pre_invoice_mentions: string;
  portal_enabled: boolean;
  portal_welcome_message: string;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  default_hourly_rate: 65,
  currency: "EUR",
  pre_invoice_mentions: "Document de pré-facturation, non assimilable à une facture légale.",
  portal_enabled: true,
  portal_welcome_message: "Bienvenue dans votre espace client",
};

export async function getUserSettings(): Promise<UserSettings | null> {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("user_settings").select("*").eq("owner_id", user.id).maybeSingle();
  if (!data) return DEFAULT_USER_SETTINGS;

  return {
    default_hourly_rate: Number(data.default_hourly_rate ?? DEFAULT_USER_SETTINGS.default_hourly_rate),
    currency: data.currency ?? DEFAULT_USER_SETTINGS.currency,
    pre_invoice_mentions: data.pre_invoice_mentions ?? DEFAULT_USER_SETTINGS.pre_invoice_mentions,
    portal_enabled: data.portal_enabled ?? DEFAULT_USER_SETTINGS.portal_enabled,
    portal_welcome_message: data.portal_welcome_message ?? DEFAULT_USER_SETTINGS.portal_welcome_message,
  };
}
