import {
  getCase,
  getCases,
  getChecklists,
  getClient,
  getClients,
  getDocuments,
  missingChecklistItems,
} from "@/lib/data";
import { getSupabaseDocumentBoard, type DocumentBoard, type ClientDocGroup } from "@/lib/supabase/documents";
import { getSupabaseClientOptions } from "@/lib/supabase/cases";
import { getSupabaseCaseOptions } from "@/lib/supabase/tasks";
import { daysSince } from "@/lib/utils";
import { DocumentsView } from "./documents-view";

export default async function DocumentsPage() {
  const supabaseBoard = await getSupabaseDocumentBoard();
  const isDemo = supabaseBoard === null;

  let board: DocumentBoard;
  let clientOptions: { id: string; name: string }[];
  let caseOptions: { id: string; title: string }[];

  if (supabaseBoard) {
    board = supabaseBoard;
    const [clients, cases] = await Promise.all([getSupabaseClientOptions(), getSupabaseCaseOptions()]);
    clientOptions = clients ?? [];
    caseOptions = (cases ?? []).map((c) => ({ id: c.id, title: c.title }));
  } else {
    const documents = getDocuments();
    const missing = missingChecklistItems();

    const groupsMap = new Map<string, ClientDocGroup>();
    for (const item of missing) {
      const checklist = getChecklists().find((c) => c.id === item.checklist_id);
      const hrCase = checklist?.hr_case_id ? getCase(checklist.hr_case_id) : null;
      const client = hrCase ? getClient(hrCase.client_id) : null;
      const key = client?.id ?? "sans-client";
      if (!groupsMap.has(key)) {
        groupsMap.set(key, { client_id: key, client_name: client?.name ?? "Sans client", items: [] });
      }
      groupsMap.get(key)!.items.push({
        id: item.id,
        name: item.name,
        required: item.required,
        status: item.status,
        case_title: hrCase?.title ?? null,
        days: daysSince(item.created_at),
      });
    }

    board = {
      documents: documents.map((d) => ({
        id: d.id,
        name: d.name,
        document_type: d.document_type,
        client_name: d.client_id ? getClient(d.client_id)?.name ?? null : null,
        case_title: d.hr_case_id ? getCase(d.hr_case_id)?.title ?? null : null,
        status: d.status,
        created_at: d.created_at,
        expiration_date: d.expiration_date,
      })),
      groups: Array.from(groupsMap.values()),
      total: documents.length,
      missing: missing.length,
      validated: documents.filter((d) => d.status === "valide").length,
      toFix: documents.filter((d) => d.status === "a_corriger" || d.status === "expire").length,
    };
    clientOptions = getClients().map((c) => ({ id: c.id, name: c.name }));
    caseOptions = getCases().map((c) => ({ id: c.id, title: c.title }));
  }

  return <DocumentsView board={board} clientOptions={clientOptions} caseOptions={caseOptions} isDemo={isDemo} />;
}
