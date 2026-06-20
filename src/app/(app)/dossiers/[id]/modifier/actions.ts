"use server";

import { redirect } from "next/navigation";
import { updateCaseRecord, type UpdateCaseInput } from "@/lib/supabase/case-mutations";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item : "";
}

export async function updateCaseAction(caseId: string, formData: FormData) {
  const input: UpdateCaseInput = {
    title: value(formData, "title"),
    person_name: value(formData, "person_name"),
    case_type: value(formData, "case_type") as UpdateCaseInput["case_type"],
    description: value(formData, "description"),
    status: value(formData, "status") as UpdateCaseInput["status"],
    priority: value(formData, "priority") as UpdateCaseInput["priority"],
    due_date: value(formData, "due_date"),
    internal_notes: value(formData, "internal_notes"),
  };

  const result = await updateCaseRecord(caseId, input);
  if (!result.ok && result.reason === "unauthenticated") redirect("/login");
  redirect(`/dossiers/${caseId}`);
}
