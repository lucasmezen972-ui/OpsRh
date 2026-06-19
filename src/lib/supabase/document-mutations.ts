import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "./server";
import type { DocumentStatus, DocumentType } from "@/lib/types";

export type MutationResult =
  | { ok: true }
  | { ok: false; reason: "demo_mode" | "unauthenticated" | "validation" | "database"; message: string };

export type CreateDocumentInput = {
  name: string;
  client_id?: string | null;
  hr_case_id?: string | null;
  document_type?: DocumentType;
  status?: DocumentStatus;
  expiration_date?: string | null;
  file?: File | null;
};

const DOCUMENT_BUCKET = "documents";
const MAX_FILE_SIZE = Number(process.env.NEXT_PUBLIC_MAX_DOCUMENT_UPLOAD_BYTES ?? 10 * 1024 * 1024);
const ALLOWED_FILE_TYPES = new Set(["application/pdf", "image/png", "image/jpeg"]);

function clean(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function ownerClient() {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return { supabase: null, user: null } as const;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user } as const;
}

export async function createDocumentRecord(input: CreateDocumentInput): Promise<MutationResult> {
  const { supabase, user } = await ownerClient();
  if (!supabase) return { ok: false, reason: "demo_mode", message: "Supabase n'est pas configuré." };
  if (!user) return { ok: false, reason: "unauthenticated", message: "Vous devez être connecté." };

  const name = clean(input.name);
  if (!name) return { ok: false, reason: "validation", message: "Le nom du document est obligatoire." };

  let filePath: string | null = null;
  let fileType: string | null = null;
  const file = input.file;
  if (file && file.size > 0) {
    if (!ALLOWED_FILE_TYPES.has(file.type)) {
      return { ok: false, reason: "validation", message: "Formats acceptés : PDF, PNG, JPG ou JPEG." };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { ok: false, reason: "validation", message: "Le fichier dépasse la taille maximum autorisée." };
    }

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const safeName = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
    filePath = `${user.id}/${clean(input.client_id) ?? "sans-client"}/${clean(input.hr_case_id) ?? "sans-dossier"}/${Date.now()}-${safeName}.${extension}`;
    fileType = file.type;

    const { error: uploadError } = await supabase.storage.from(DOCUMENT_BUCKET).upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) return { ok: false, reason: "database", message: uploadError.message };
  }

  const { error } = await supabase.from("documents").insert({
    owner_id: user.id,
    client_id: clean(input.client_id),
    hr_case_id: clean(input.hr_case_id),
    name,
    document_type: input.document_type ?? "autre",
    status: input.status ?? "recu",
    expiration_date: clean(input.expiration_date),
    uploaded_by: user.id,
    file_url: filePath,
    file_type: fileType,
  });
  if (error) return { ok: false, reason: "database", message: error.message };

  await supabase.from("activity_logs").insert({
    owner_id: user.id,
    actor_id: user.id,
    client_id: clean(input.client_id),
    hr_case_id: clean(input.hr_case_id),
    action_type: "document_ajoute",
    description: `Document ajouté : ${name}`,
  });

  revalidatePath("/documents");
  return { ok: true };
}

export async function updateDocumentStatusRecord(id: string, status: DocumentStatus): Promise<MutationResult> {
  const { supabase, user } = await ownerClient();
  if (!supabase) return { ok: false, reason: "demo_mode", message: "Mode démo." };
  if (!user) return { ok: false, reason: "unauthenticated", message: "Non connecté." };

  const { error } = await supabase
    .from("documents")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return { ok: false, reason: "database", message: error.message };

  revalidatePath("/documents");
  revalidatePath("/dossiers");
  return { ok: true };
}

export async function deleteDocumentRecord(id: string): Promise<MutationResult> {
  const { supabase, user } = await ownerClient();
  if (!supabase) return { ok: false, reason: "demo_mode", message: "Mode démo." };
  if (!user) return { ok: false, reason: "unauthenticated", message: "Non connecté." };

  const { data, error: readError } = await supabase
    .from("documents")
    .select("file_url")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (readError) return { ok: false, reason: "database", message: readError.message };

  if (data?.file_url) {
    const { error: storageError } = await supabase.storage.from(DOCUMENT_BUCKET).remove([data.file_url]);
    if (storageError) return { ok: false, reason: "database", message: storageError.message };
  }

  const { error } = await supabase.from("documents").delete().eq("id", id).eq("owner_id", user.id);
  if (error) return { ok: false, reason: "database", message: error.message };

  revalidatePath("/documents");
  return { ok: true };
}

export async function getDocumentDownloadUrl(id: string): Promise<
  | { ok: true; url: string }
  | { ok: false; reason: "demo_mode" | "unauthenticated" | "not_found" | "database"; message: string }
> {
  const { supabase, user } = await ownerClient();
  if (!supabase) return { ok: false, reason: "demo_mode", message: "Mode démo." };
  if (!user) return { ok: false, reason: "unauthenticated", message: "Non connecté." };

  const { data, error } = await supabase
    .from("documents")
    .select("file_url")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (error) return { ok: false, reason: "database", message: error.message };
  if (!data?.file_url) return { ok: false, reason: "not_found", message: "Aucun fichier associé à ce document." };

  const { data: signed, error: signedError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(data.file_url, 60);
  if (signedError || !signed?.signedUrl) {
    return { ok: false, reason: "database", message: signedError?.message ?? "Lien de téléchargement indisponible." };
  }

  return { ok: true, url: signed.signedUrl };
}

/** Met à jour le statut d'une pièce de checklist (relancer / reçu / validé). */
export async function setChecklistItemStatusRecord(itemId: string, status: DocumentStatus): Promise<MutationResult> {
  const { supabase, user } = await ownerClient();
  if (!supabase) return { ok: false, reason: "demo_mode", message: "Mode démo." };
  if (!user) return { ok: false, reason: "unauthenticated", message: "Non connecté." };

  // RLS garantit que la pièce appartient à une checklist de l'utilisateur.
  const { error } = await supabase
    .from("checklist_items")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", itemId);
  if (error) return { ok: false, reason: "database", message: error.message };

  revalidatePath("/documents");
  return { ok: true };
}
