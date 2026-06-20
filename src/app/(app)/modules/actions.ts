"use server";

import type { AiRequestKind, ImportSource } from "@/lib/advanced-modules";
import {
  analyzeDocument,
  createSignatureRequest,
  importInboundMessage,
  runAiAssistant,
  signSignatureRequest,
} from "@/lib/supabase/advanced-modules";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item : "";
}

export async function runAiAssistantAction(formData: FormData) {
  return runAiAssistant({
    kind: value(formData, "kind") as AiRequestKind,
    prompt: value(formData, "prompt"),
    clientId: value(formData, "client_id"),
    caseId: value(formData, "hr_case_id"),
  });
}

export async function createSignatureRequestAction(formData: FormData) {
  return createSignatureRequest({
    title: value(formData, "title"),
    signerName: value(formData, "signer_name"),
    signerEmail: value(formData, "signer_email"),
    clientId: value(formData, "client_id"),
    caseId: value(formData, "hr_case_id"),
    documentBody: value(formData, "document_body"),
  });
}

export async function signSignatureRequestAction(formData: FormData) {
  return signSignatureRequest({
    requestId: value(formData, "request_id"),
    signerName: value(formData, "signer_name"),
    signatureValue: value(formData, "signature_value"),
  });
}

export async function analyzeDocumentAction(formData: FormData) {
  const file = formData.get("file");
  return analyzeDocument({
    documentId: value(formData, "document_id"),
    filename: value(formData, "filename") || (file instanceof File && file.size > 0 ? file.name : ""),
    mimeType: value(formData, "mime_type") || (file instanceof File && file.size > 0 ? file.type : ""),
    content: value(formData, "content"),
  });
}

export async function importInboundMessageAction(formData: FormData) {
  return importInboundMessage({
    source: value(formData, "source") as ImportSource,
    rawContent: value(formData, "raw_content"),
    clientId: value(formData, "client_id"),
    caseId: value(formData, "hr_case_id"),
    createTask: value(formData, "create_task") === "on",
  });
}
