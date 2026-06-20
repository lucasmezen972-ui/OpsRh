import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "./server";

export type NotificationMutationResult =
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

export async function markNotificationRead(id: string): Promise<NotificationMutationResult> {
  const { supabase, user } = await ownerClient();
  if (!supabase) return { ok: false, reason: "configuration", message: "Supabase non configuré." };
  if (!user) return { ok: false, reason: "unauthenticated", message: "Vous devez etre connecte." };

  const { error } = await supabase.from("notifications").update({ status: "lue" }).eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false, reason: "database", message: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<NotificationMutationResult> {
  const { supabase, user } = await ownerClient();
  if (!supabase) return { ok: false, reason: "configuration", message: "Supabase non configuré." };
  if (!user) return { ok: false, reason: "unauthenticated", message: "Vous devez etre connecte." };

  const { error } = await supabase.from("notifications").update({ status: "lue" }).eq("user_id", user.id).eq("status", "non_lue");
  if (error) return { ok: false, reason: "database", message: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
