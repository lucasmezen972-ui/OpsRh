"use server";

import { redirect } from "next/navigation";
import {
  createDocumentRecord,
  deleteDocumentRecord,
  getDocumentDownloadUrl,
  setChecklistItemStatusRecord,
  updateDocumentStatusRecord,
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
    file: formData.get("file") instanceof File ? (formData.get("file") as File) : null,
  };

  const result = await createDocumentRecord(input);
  if (!result.ok && result.reason === "unauthenticated") redirect("/login");
  if (!result.ok) redirect(`/documents?error=${encodeURIComponent(result.message)}`);
  redirect("/documents");
}

export async function setChecklistItemStatusAction(itemId: string, status: DocumentStatus) {
  const result = await setChecklistItemStatusRecord(itemId, status);
  if (!result.ok && result.reason === "unauthenticated") redirect("/login");
  return result;
}

export async function updateDocumentStatusAction(id: string, status: DocumentStatus) {
  const result = await updateDocumentStatusRecord(id, status);
  if (!result.ok && result.reason === "unauthenticated") redirect("/login");
  return result;
}

export async function deleteDocumentAction(id: string) {
  const result = await deleteDocumentRecord(id);
  if (!result.ok && result.reason === "unauthenticated") redirect("/login");
  return result;
}

export async function getDocumentDownloadUrlAction(id: string) {
  const result = await getDocumentDownloadUrl(id);
  if (!result.ok && result.reason === "unauthenticated") redirect("/login");
  return result;
}
