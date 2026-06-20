import { getAdvancedModuleOptions } from "@/lib/supabase/advanced-modules";
import { AnalyseView } from "./view";

export default async function AnalysePage({ searchParams }: { searchParams?: { documentId?: string } }) {
  const options = await getAdvancedModuleOptions();
  return <AnalyseView options={options} initialDocumentId={searchParams?.documentId ?? ""} />;
}
