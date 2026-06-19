"use server";

import { redirect } from "next/navigation";
import { createEmailTemplate, markGeneratedEmailSent, saveGeneratedEmail } from "@/lib/supabase/email-mutations";

export async function saveGeneratedEmailAction(input: {
  client_id?: string | null;
  hr_case_id?: string | null;
  subject: string;
  body: string;
  status?: "brouillon" | "envoye";
}) {
  const result = await saveGeneratedEmail(input);
  if (!result.ok && result.reason === "unauthenticated") redirect("/login");
  return result;
}

export async function markGeneratedEmailSentAction(id: string) {
  const result = await markGeneratedEmailSent(id);
  if (!result.ok && result.reason === "unauthenticated") redirect("/login");
  return result;
}

export async function createEmailTemplateAction(input: {
  title: string;
  type: string;
  subject: string;
  body: string;
  variables?: string[];
}) {
  const result = await createEmailTemplate(input);
  if (!result.ok && result.reason === "unauthenticated") redirect("/login");
  return result;
}
