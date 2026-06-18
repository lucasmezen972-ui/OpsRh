"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type AuthResult = { error: string } | undefined;

export async function login(_prev: AuthResult, formData: FormData): Promise<AuthResult> {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) {
    return { error: "Supabase n'est pas configuré. Utilisez « Explorer en mode démo »." };
  }

  const email = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email ou mot de passe incorrect." };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(_prev: AuthResult, formData: FormData): Promise<AuthResult> {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) {
    return { error: "Supabase n'est pas configuré. Utilisez « Explorer en mode démo »." };
  }

  const email = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const fullName = formData.get("full_name")?.toString().trim() ?? "";
  const companyName = formData.get("company_name")?.toString().trim() ?? "";

  if (password.length < 6) return { error: "Le mot de passe doit faire au moins 6 caractères." };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) return { error: error.message };

  if (data.user && data.session) {
    await supabase
      .from("profiles")
      .update({ full_name: fullName, company_name: companyName || null })
      .eq("id", data.user.id);
  }

  if (!data.session) {
    return { error: "Compte créé. Vérifiez votre email pour confirmer, puis connectez-vous." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = createClient();
  if (supabase) await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
