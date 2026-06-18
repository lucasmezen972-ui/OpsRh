import { getClient, getClientCases, getClientRequests } from "@/lib/data";
import { getSupabasePortalPreview, type PortalPreview } from "@/lib/supabase/portal";
import { PortalView } from "./portal-view";

const DEMO_CLIENT_ID = "c1";
const DEMO_MISSING_DOCS = ["RIB", "Pièce d'identité", "Contrat signé"];

export default async function PortailPage() {
  const supabasePreview = await getSupabasePortalPreview();
  const isDemo = supabasePreview === null;

  const preview: PortalPreview = supabasePreview ?? {
    client: (() => {
      const c = getClient(DEMO_CLIENT_ID);
      return c ? { id: c.id, name: c.name } : null;
    })(),
    cases: getClientCases(DEMO_CLIENT_ID).map((c) => ({
      id: c.id,
      title: c.title,
      person_name: c.person_name,
      status: c.status,
    })),
    requests: getClientRequests()
      .filter((r) => r.client_id === DEMO_CLIENT_ID)
      .map((r) => ({ id: r.id, title: r.title, type: r.type, status: r.status })),
    missingDocs: DEMO_MISSING_DOCS,
  };

  return <PortalView preview={preview} isDemo={isDemo} />;
}
