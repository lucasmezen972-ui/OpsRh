"use server";

import { createEmailTemplate, markGeneratedEmailSent, saveGeneratedEmail } from "@/lib/supabase/email-mutations";

export async function saveGeneratedEmailAction(input: {
  client_id?: string | null;
  hr_case_id?: string | null;
  subject: string;
  body: string;
  status?: "brouillon" | "envoye";
}) {
  return saveGeneratedEmail(input);
}

export async function markGeneratedEmailSentAction(id: string) {
  return markGeneratedEmailSent(id);
}

export async function createEmailTemplateAction(input: {
  title: string;
  type: string;
  subject: string;
  body: string;
  variables?: string[];
}) {
  return createEmailTemplate(input);
}
