import { createClient, isSupabaseConfigured } from "./server";
import type { DocumentStatus, DocumentType } from "@/lib/types";

export interface DocRow {
  id: string;
  name: string;
  file_url: string | null;
  document_type: DocumentType;
  client_name: string | null;
  case_title: string | null;
  status: DocumentStatus;
  created_at: string;
  expiration_date: string | null;
}

export interface MissingDocItem {
  id: string;
  name: string;
  required: boolean;
  status: DocumentStatus;
  case_title: string | null;
  days: number;
}

export interface ClientDocGroup {
  client_id: string;
  client_name: string;
  items: MissingDocItem[];
}

export interface DocumentBoard {
  documents: DocRow[];
  groups: ClientDocGroup[];
  total: number;
  missing: number;
  validated: number;
  toFix: number;
}

const MISSING_DOC_STATES = ["demande", "a_corriger", "expire"];

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

/** Tableau des documents + pièces manquantes regroupées par client. Null en configuration production. */
export async function getSupabaseDocumentBoard(): Promise<DocumentBoard | null> {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: documents, error }, { data: clients }, { data: cases }, { data: checklists }] = await Promise.all([
    supabase
      .from("documents")
      .select("id,name,file_url,document_type,client_id,hr_case_id,status,created_at,expiration_date")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id,name").eq("owner_id", user.id),
    supabase.from("hr_cases").select("id,title,client_id").eq("owner_id", user.id),
    supabase.from("document_checklists").select("id,client_id,hr_case_id").eq("owner_id", user.id),
  ]);
  if (error) throw new Error(`Impossible de charger les documents : ${error.message}`);

  const docs = documents ?? [];
  const clientName = new Map((clients ?? []).map((c) => [c.id, c.name]));
  const caseTitle = new Map((cases ?? []).map((c) => [c.id, c.title]));

  const docRows: DocRow[] = docs.map((d) => ({
    id: d.id,
    name: d.name,
    file_url: d.file_url,
    document_type: d.document_type as DocumentType,
    client_name: d.client_id ? clientName.get(d.client_id) ?? null : null,
    case_title: d.hr_case_id ? caseTitle.get(d.hr_case_id) ?? null : null,
    status: d.status as DocumentStatus,
    created_at: d.created_at,
    expiration_date: d.expiration_date,
  }));

  const validated = docs.filter((d) => d.status === "valide").length;
  const toFix = docs.filter((d) => d.status === "a_corriger" || d.status === "expire").length;

  // Pièces manquantes des checklists, regroupées par client.
  const groupsMap = new Map<string, ClientDocGroup>();
  let missingCount = 0;
  const checklistIds = (checklists ?? []).map((c) => c.id);
  const checklistMeta = new Map((checklists ?? []).map((c) => [c.id, c]));

  if (checklistIds.length > 0) {
    const { data: items } = await supabase
      .from("checklist_items")
      .select("id,checklist_id,name,required,status,created_at")
      .in("checklist_id", checklistIds)
      .in("status", MISSING_DOC_STATES);

    for (const item of items ?? []) {
      missingCount += 1;
      const meta = checklistMeta.get(item.checklist_id);
      const clientId = meta?.client_id ?? "sans-client";
      const caseId = meta?.hr_case_id ?? null;
      if (!groupsMap.has(clientId)) {
        groupsMap.set(clientId, {
          client_id: clientId,
          client_name: clientId === "sans-client" ? "Sans client" : clientName.get(clientId) ?? "Sans client",
          items: [],
        });
      }
      groupsMap.get(clientId)!.items.push({
        id: item.id,
        name: item.name,
        required: item.required,
        status: item.status as DocumentStatus,
        case_title: caseId ? caseTitle.get(caseId) ?? null : null,
        days: daysSince(item.created_at),
      });
    }
  }

  return {
    documents: docRows,
    groups: Array.from(groupsMap.values()),
    total: docs.length,
    missing: missingCount,
    validated,
    toFix,
  };
}
