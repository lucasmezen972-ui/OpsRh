"use server";

import { redirect } from "next/navigation";
import { createCaseRecord, type CreateCaseInput } from "@/lib/supabase/case-mutations";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item : "";
}

export async function createCaseAction(formData: FormData) {
  const input: CreateCaseInput = {
    title: value(formData, "title"),
    client_id: value(formData, "client_id"),
    person_name: value(formData, "person_name"),
    case_type: value(formData, "case_type") as CreateCaseInput["case_type"],
    description: value(formData, "description"),
    status: value(formData, "status") as CreateCaseInput["status"],
    priority: value(formData, "priority") as CreateCaseInput["priority"],
    due_date: value(formData, "due_date"),
    internal_notes: value(formData, "internal_notes"),
    expected_documents: value(formData, "expected_documents"),
  };

  const result = await createCaseRecord(input);

  if (!result.ok && result.reason === "unauthenticated") {
    redirect("/login");
  }

  if (result.ok) {
    redirect(`/dossiers/${result.caseId}`);
  }

  // En mode démo ou en cas d'erreur de validation, on revient à la liste.
  redirect("/dossiers");
}
