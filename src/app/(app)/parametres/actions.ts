"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

export async function updateProfileAction(formData: FormData) {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return; // mode démo : pas de persistance

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("profiles")
    .update({
      full_name: value(formData, "full_name"),
      company_name: value(formData, "company_name") || null,
    })
    .eq("id", user.id);

  revalidatePath("/parametres");
  revalidatePath("/", "layout");
}
