import { getAdvancedModuleOptions } from "@/lib/supabase/advanced-modules";
import { ReportingView } from "./view";

export default async function ReportingPage() {
  const options = await getAdvancedModuleOptions();
  return <ReportingView options={options} />;
}
