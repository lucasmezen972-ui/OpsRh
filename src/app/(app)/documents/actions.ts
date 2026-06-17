"use server";

import { redirect } from "next/navigation";
import {
  createDocumentRecord,
  setChecklistItemStatusRecord,
  type CreateDocumentInput,
} from "@/lib/supabase/document-mutations";
import type { DocumentStatus } from "@/lib/types";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item : "";
}

export async function createDocumentAction(formData: FormData) {
  const input: CreateDocumentInput = {
    name: value(formData, "name"),
    client_id: value(formData, "client_id"),
    hr_case_id: value(formData, "hr_case_id"),
    document_type: value(formData, "document_type") as CreateDocumentInput["document_type"],
    status: value(formData, "status") as CreateDocumentInput["status"],
    expiration_date: value(formData, "expiration_date"),
  };

  const result = await createDocumentRecord(input);
  if (!result.ok && result.reason === "unauthenticated") redirect("/login");
  redirect("/documents");
}

export async function setChecklistItemStatusAction(itemId: string, status: DocumentStatus) {
  const result = await setChecklistItemStatusRecord(itemId, status);
  if (!result.ok && result.reason === "unauthenticated") redirect("/login");
}
