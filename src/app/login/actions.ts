"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { APP_CONFIG } from "@/lib/app-config";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type AuthResult = { error: string } | undefined;

export async function login(_prev: AuthResult, formData: FormData): Promise<AuthResult> {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) {
    return { error: "Supabase n'est pas configuré. Contactez le support Ops RH." };
  }

  const email = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email ou mot de passe incorrect." };

  revalidatePath("/", "layout");
  redirect(safeRedirect(formData.get("next")?.toString()) ?? "/dashboard");
}

export async function signup(_prev: AuthResult, formData: FormData): Promise<AuthResult> {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) {
    return { error: "Supabase n'est pas configuré. Contactez le support Ops RH." };
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

  if (data.user) {
    const displayName = fullName || email.split("@")[0];
    const orgName = companyName || `${displayName} RH`;

    await supabase.from("profiles").upsert({
      id: data.user.id,
      email,
      full_name: displayName,
      company_name: orgName,
      role: "freelance",
    });

    const { data: organization } = await supabase
      .from("organizations")
      .insert({
        name: orgName,
        owner_id: data.user.id,
        contact_email: APP_CONFIG.contactEmail,
      })
      .select("id")
      .single();

    if (organization?.id) {
      const trialStart = new Date();
      const trialEnd = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000);

      await Promise.all([
        supabase.from("organization_members").insert({
          organization_id: organization.id,
          user_id: data.user.id,
          role: "owner",
        }),
        supabase.from("subscriptions").insert({
          organization_id: organization.id,
          status: "trialing",
          plan_key: "pro",
          trial_start: trialStart.toISOString(),
          trial_end: trialEnd.toISOString(),
        }),
      ]);
    }
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

export async function resetPassword(_prev: AuthResult, formData: FormData): Promise<AuthResult> {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return { error: "Supabase n'est pas configuré." };

  const email = formData.get("email")?.toString().trim() ?? "";
  if (!email) return { error: "L'adresse e-mail est obligatoire." };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${APP_CONFIG.appUrl}/reset-password`,
  });

  if (error) return { error: error.message };
  return { error: "Si un compte existe, un e-mail de réinitialisation vient d'être envoyé." };
}

export async function updatePassword(_prev: AuthResult, formData: FormData): Promise<AuthResult> {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return { error: "Supabase n'est pas configuré." };

  const password = formData.get("password")?.toString() ?? "";
  if (password.length < 8) return { error: "Le mot de passe doit faire au moins 8 caractères." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/dashboard");
}

function safeRedirect(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}
