import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "./server";

export type EmailMutationResult =
  | { ok: true; id?: string }
  | { ok: false; reason: "demo_mode" | "unauthenticated" | "validation" | "database"; message: string };

async function ownerClient() {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return { supabase: null, user: null } as const;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user } as const;
}

function clean(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export async function saveGeneratedEmail(input: {
  client_id?: string | null;
  hr_case_id?: string | null;
  subject: string;
  body: string;
  status?: "brouillon" | "envoye";
}): Promise<EmailMutationResult> {
  const { supabase, user } = await ownerClient();
  if (!supabase) return { ok: false, reason: "demo_mode", message: "Mode demo." };
  if (!user) return { ok: false, reason: "unauthenticated", message: "Vous devez etre connecte." };
  if (!clean(input.subject)) return { ok: false, reason: "validation", message: "L'objet est obligatoire." };
  if (!clean(input.body)) return { ok: false, reason: "validation", message: "Le corps du mail est obligatoire." };

  const { data, error } = await supabase
    .from("generated_emails")
    .insert({
      owner_id: user.id,
      client_id: clean(input.client_id),
      hr_case_id: clean(input.hr_case_id),
      subject: input.subject.trim(),
      body: input.body.trim(),
      status: input.status ?? "brouillon",
    })
    .select("id")
    .single();
  if (error) return { ok: false, reason: "database", message: error.message };

  revalidatePath("/mails");
  return { ok: true, id: data?.id };
}

export async function markGeneratedEmailSent(id: string): Promise<EmailMutationResult> {
  const { supabase, user } = await ownerClient();
  if (!supabase) return { ok: false, reason: "demo_mode", message: "Mode demo." };
  if (!user) return { ok: false, reason: "unauthenticated", message: "Vous devez etre connecte." };

  const { error } = await supabase
    .from("generated_emails")
    .update({ status: "envoye", sent_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return { ok: false, reason: "database", message: error.message };

  revalidatePath("/mails");
  return { ok: true, id };
}

export async function createEmailTemplate(input: {
  title: string;
  type: string;
  subject: string;
  body: string;
  variables?: string[];
}): Promise<EmailMutationResult> {
  const { supabase, user } = await ownerClient();
  if (!supabase) return { ok: false, reason: "demo_mode", message: "Mode demo." };
  if (!user) return { ok: false, reason: "unauthenticated", message: "Vous devez etre connecte." };
  if (!clean(input.title) || !clean(input.subject) || !clean(input.body)) {
    return { ok: false, reason: "validation", message: "Titre, objet et corps sont obligatoires." };
  }

  const { data, error } = await supabase
    .from("email_templates")
    .insert({
      owner_id: user.id,
      title: input.title.trim(),
      type: clean(input.type) ?? "autre",
      subject: input.subject.trim(),
      body: input.body.trim(),
      variables: input.variables ?? [],
    })
    .select("id")
    .single();
  if (error) return { ok: false, reason: "database", message: error.message };

  revalidatePath("/mails");
  return { ok: true, id: data?.id };
}
