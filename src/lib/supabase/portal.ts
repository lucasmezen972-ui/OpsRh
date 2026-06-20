import { createClient, isSupabaseConfigured } from "./server";
import type { CaseStatus, ClientRequestStatus, ClientRequestType } from "@/lib/types";

export interface PortalPreview {
  client: { id: string; name: string } | null;
  cases: { id: string; title: string; person_name: string | null; status: CaseStatus }[];
  requests: { id: string; title: string; type: ClientRequestType; status: ClientRequestStatus }[];
  missingDocs: string[];
}

const MISSING_DOC_STATES = ["demande", "a_corriger", "expire"];

/** Aperçu du portail pour le premier client de l'utilisateur. Null en configuration production. */
export async function getSupabasePortalPreview(): Promise<PortalPreview | null> {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: client } = await supabase
    .from("clients")
    .select("id,name")
    .eq("owner_id", user.id)
    .order("name")
    .limit(1)
    .maybeSingle();

  if (!client) {
    return { client: null, cases: [], requests: [], missingDocs: [] };
  }

  const [{ data: cases }, { data: requests }, { data: checklists }] = await Promise.all([
    supabase
      .from("hr_cases")
      .select("id,title,person_name,status")
      .eq("client_id", client.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("client_requests")
      .select("id,title,type,status")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false }),
    supabase.from("document_checklists").select("id").eq("client_id", client.id),
  ]);

  let missingDocs: string[] = [];
  const checklistIds = (checklists ?? []).map((c) => c.id);
  if (checklistIds.length > 0) {
    const { data: items } = await supabase
      .from("checklist_items")
      .select("name,status")
      .in("checklist_id", checklistIds)
      .in("status", MISSING_DOC_STATES);
    missingDocs = (items ?? []).map((i) => i.name);
  }

  return {
    client: { id: client.id, name: client.name },
    cases: (cases ?? []) as PortalPreview["cases"],
    requests: (requests ?? []) as PortalPreview["requests"],
    missingDocs,
  };
}
