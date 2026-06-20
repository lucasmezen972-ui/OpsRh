import { revalidatePath } from "next/cache";
import {
  analyzeDocumentContent,
  buildAiAssistantDraft,
  parseInboundMessage,
  type AdvancedDocumentType,
  type AdvancedModuleOptions,
  type AiAssistantDraft,
  type AiRequestKind,
  type DocumentAnalysisResult,
  type ImportSource,
  type ImportedMessageResult,
} from "@/lib/advanced-modules";
import { getCases, getClients, getDocuments } from "@/lib/data";
import { createClient, isSupabaseConfigured } from "./server";

export type ModuleActionResult<T> =
  | { ok: true; data: T; persisted: boolean; message?: string }
  | { ok: false; reason: "unauthenticated" | "validation" | "database"; message: string };

function clean(value: FormDataEntryValue | string | null | undefined) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isMissingTableError(error: { message?: string; code?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "42P01" || message.includes("does not exist") || message.includes("schema cache");
}

async function ownerClient() {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return { supabase: null, user: null } as const;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user } as const;
}

function demoOptions(): AdvancedModuleOptions {
  return {
    isDemo: true,
    clients: getClients().map((client) => ({
      id: client.id,
      name: client.name,
      main_contact_name: client.main_contact_name,
      main_contact_email: client.main_contact_email,
    })),
    cases: getCases().map((hrCase) => ({
      id: hrCase.id,
      title: hrCase.title,
      client_id: hrCase.client_id,
      person_name: hrCase.person_name,
      description: hrCase.description,
      due_date: hrCase.due_date,
    })),
    documents: getDocuments().map((document) => ({
      id: document.id,
      name: document.name,
      client_id: document.client_id,
      hr_case_id: document.hr_case_id,
      file_type: document.file_type,
      document_type: document.document_type as AdvancedDocumentType,
      status: document.status,
      expiration_date: document.expiration_date,
    })),
  };
}

export async function getAdvancedModuleOptions(): Promise<AdvancedModuleOptions> {
  const { supabase, user } = await ownerClient();
  if (!supabase || !user) return demoOptions();

  const [{ data: clients, error: clientsError }, { data: cases, error: casesError }, { data: documents, error: docsError }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id,name,main_contact_name,main_contact_email")
        .eq("owner_id", user.id)
        .order("name"),
      supabase
        .from("hr_cases")
        .select("id,title,client_id,person_name,description,due_date")
        .eq("owner_id", user.id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("documents")
        .select("id,name,client_id,hr_case_id,file_type,document_type,status,expiration_date")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

  if (clientsError || casesError || docsError) {
    throw new Error(clientsError?.message ?? casesError?.message ?? docsError?.message ?? "Chargement impossible.");
  }

  return {
    isDemo: false,
    clients:
      clients?.map((client) => ({
        id: client.id,
        name: client.name,
        main_contact_name: client.main_contact_name,
        main_contact_email: client.main_contact_email,
      })) ?? [],
    cases:
      cases?.map((hrCase) => ({
        id: hrCase.id,
        title: hrCase.title,
        client_id: hrCase.client_id,
        person_name: hrCase.person_name,
        description: hrCase.description,
        due_date: hrCase.due_date,
      })) ?? [],
    documents:
      documents?.map((document) => ({
        id: document.id,
        name: document.name,
        client_id: document.client_id,
        hr_case_id: document.hr_case_id,
        file_type: document.file_type,
        document_type: document.document_type as AdvancedDocumentType,
        status: document.status,
        expiration_date: document.expiration_date,
      })) ?? [],
  };
}

export async function runAiAssistant(input: {
  kind: AiRequestKind;
  prompt: string;
  clientId?: string | null;
  caseId?: string | null;
}): Promise<ModuleActionResult<AiAssistantDraft>> {
  const options = await getAdvancedModuleOptions();
  const data = buildAiAssistantDraft({
    kind: input.kind,
    prompt: input.prompt,
    clientId: input.clientId,
    caseId: input.caseId,
    options,
  });

  const { supabase, user } = await ownerClient();
  if (!supabase || !user) return { ok: true, data, persisted: false, message: "Résultat généré en mode démo." };

  const { error } = await supabase.from("ai_assistant_runs").insert({
    owner_id: user.id,
    client_id: clean(input.clientId),
    hr_case_id: clean(input.caseId),
    request_type: input.kind,
    prompt: clean(input.prompt),
    result_subject: data.subject,
    result_body: data.body,
    result_actions: data.nextActions,
  });
  if (error) {
    if (isMissingTableError(error)) {
      return { ok: true, data, persisted: false, message: "Proposition générée, historique Supabase non installé." };
    }
    return { ok: false, reason: "database", message: error.message };
  }

  await supabase.from("activity_logs").insert({
    owner_id: user.id,
    actor_id: user.id,
    client_id: clean(input.clientId),
    hr_case_id: clean(input.caseId),
    action_type: "assistant_ia",
    description: `Assistant IA utilisé : ${data.subject}`,
  });

  revalidatePath("/modules/ia");
  return { ok: true, data, persisted: true, message: "Proposition enregistrée dans l'historique." };
}

export async function createSignatureRequest(input: {
  title: string;
  signerName: string;
  signerEmail?: string | null;
  clientId?: string | null;
  caseId?: string | null;
  documentBody: string;
}): Promise<ModuleActionResult<{ id: string; title: string; status: string }>> {
  const title = clean(input.title);
  const signerName = clean(input.signerName);
  const documentBody = clean(input.documentBody);
  if (!title || !signerName || !documentBody) {
    return { ok: false, reason: "validation", message: "Titre, signataire et contenu du document sont obligatoires." };
  }

  const { supabase, user } = await ownerClient();
  if (!supabase || !user) {
    return {
      ok: true,
      persisted: false,
      data: { id: `demo-${Date.now()}`, title, status: "signature_demandee" },
      message: "Demande de signature préparée en mode démo.",
    };
  }

  const { data, error } = await supabase
    .from("signature_requests")
    .insert({
      owner_id: user.id,
      client_id: clean(input.clientId),
      hr_case_id: clean(input.caseId),
      title,
      signer_name: signerName,
      signer_email: clean(input.signerEmail),
      document_body: documentBody,
      status: "signature_demandee",
    })
    .select("id,title,status")
    .single();
  if (error) {
    if (isMissingTableError(error)) {
      return {
        ok: true,
        persisted: false,
        data: { id: `local-${Date.now()}`, title, status: "signature_demandee" },
        message: "Demande préparée, table de signature non installée sur Supabase.",
      };
    }
    return { ok: false, reason: "database", message: error.message };
  }

  await supabase.from("activity_logs").insert({
    owner_id: user.id,
    actor_id: user.id,
    client_id: clean(input.clientId),
    hr_case_id: clean(input.caseId),
    action_type: "signature_demandee",
    description: `Signature demandée : ${title}`,
  });

  revalidatePath("/modules/signature");
  return { ok: true, persisted: true, data };
}

export async function signSignatureRequest(input: {
  requestId: string;
  signerName: string;
  signatureValue: string;
}): Promise<ModuleActionResult<{ status: string; signedAt: string }>> {
  const signerName = clean(input.signerName);
  const signatureValue = clean(input.signatureValue);
  if (!signerName || !signatureValue) {
    return { ok: false, reason: "validation", message: "Le nom du signataire et la signature sont obligatoires." };
  }
  const signedAt = new Date().toISOString();

  const { supabase, user } = await ownerClient();
  if (!supabase || !user || input.requestId.startsWith("demo-") || input.requestId.startsWith("local-")) {
    return { ok: true, persisted: false, data: { status: "signe", signedAt }, message: "Signature validée en mode démo." };
  }

  const { error } = await supabase
    .from("signature_requests")
    .update({ status: "signe", signed_at: signedAt, signature_value: signatureValue, signer_name: signerName })
    .eq("id", input.requestId)
    .eq("owner_id", user.id);
  if (error) {
    if (isMissingTableError(error)) {
      return { ok: true, persisted: false, data: { status: "signe", signedAt }, message: "Signature locale validée." };
    }
    return { ok: false, reason: "database", message: error.message };
  }

  await supabase.from("activity_logs").insert({
    owner_id: user.id,
    actor_id: user.id,
    action_type: "signature_effectuee",
    description: `Document signé par ${signerName}`,
  });

  revalidatePath("/modules/signature");
  return { ok: true, persisted: true, data: { status: "signe", signedAt } };
}

export async function analyzeDocument(input: {
  documentId?: string | null;
  filename: string;
  mimeType?: string | null;
  content?: string | null;
}): Promise<ModuleActionResult<DocumentAnalysisResult>> {
  const filename = clean(input.filename);
  if (!filename) return { ok: false, reason: "validation", message: "Le nom du document est obligatoire." };

  const result = analyzeDocumentContent({
    filename,
    mimeType: clean(input.mimeType),
    content: clean(input.content),
  });

  const { supabase, user } = await ownerClient();
  if (!supabase || !user) return { ok: true, data: result, persisted: false, message: "Analyse effectuée en mode démo." };

  const options = await getAdvancedModuleOptions();
  const document = options.documents.find((doc) => doc.id === input.documentId);
  const { error } = await supabase.from("document_analyses").insert({
    owner_id: user.id,
    document_id: clean(input.documentId),
    client_id: document?.client_id ?? null,
    hr_case_id: document?.hr_case_id ?? null,
    filename,
    detected_type: result.detectedType,
    confidence: result.confidence,
    expiration_date: result.expirationDate,
    issues: result.issues,
    summary: result.summary,
    suggested_status: result.suggestedStatus,
  });
  if (error) {
    if (isMissingTableError(error)) {
      return { ok: true, data: result, persisted: false, message: "Analyse réalisée, historique Supabase non installé." };
    }
    return { ok: false, reason: "database", message: error.message };
  }

  revalidatePath("/modules/analyse");
  return { ok: true, data: result, persisted: true };
}

export async function importInboundMessage(input: {
  source: ImportSource;
  rawContent: string;
  clientId?: string | null;
  caseId?: string | null;
  createTask: boolean;
}): Promise<ModuleActionResult<ImportedMessageResult & { createdTaskId: string | null }>> {
  const rawContent = clean(input.rawContent);
  if (!rawContent) return { ok: false, reason: "validation", message: "Collez le contenu du message à importer." };

  const parsed = parseInboundMessage({ source: input.source, rawContent });
  const { supabase, user } = await ownerClient();
  if (!supabase || !user) {
    return { ok: true, persisted: false, data: { ...parsed, createdTaskId: null }, message: "Message analysé en mode démo." };
  }

  let createdTaskId: string | null = null;
  if (input.createTask) {
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert({
        owner_id: user.id,
        client_id: clean(input.clientId),
        hr_case_id: clean(input.caseId),
        title: parsed.title,
        description: parsed.summary,
        type: parsed.taskType,
        priority: parsed.priority,
        status: "a_faire",
      })
      .select("id")
      .single();
    if (taskError) return { ok: false, reason: "database", message: taskError.message };
    createdTaskId = task?.id ?? null;
  }

  const { error } = await supabase.from("inbound_imports").insert({
    owner_id: user.id,
    client_id: clean(input.clientId),
    hr_case_id: clean(input.caseId),
    source: input.source,
    raw_content: rawContent,
    parsed_title: parsed.title,
    parsed_summary: parsed.summary,
    suggested_action: parsed.suggestedAction,
    created_task_id: createdTaskId,
  });
  if (error) {
    if (isMissingTableError(error)) {
      return {
        ok: true,
        persisted: Boolean(createdTaskId),
        data: { ...parsed, createdTaskId },
        message: createdTaskId
          ? "Tâche créée, historique d'import non installé."
          : "Message analysé, historique d'import non installé.",
      };
    }
    return { ok: false, reason: "database", message: error.message };
  }

  await supabase.from("activity_logs").insert({
    owner_id: user.id,
    actor_id: user.id,
    client_id: clean(input.clientId),
    hr_case_id: clean(input.caseId),
    action_type: `import_${input.source}`,
    description: `Message importé : ${parsed.title}`,
  });

  revalidatePath("/modules/import");
  revalidatePath("/taches");
  return { ok: true, persisted: true, data: { ...parsed, createdTaskId } };
}
