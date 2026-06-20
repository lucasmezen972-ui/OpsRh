import { getAdvancedModuleOptions } from "@/lib/supabase/advanced-modules";
import { AssistantView } from "./view";

export default async function AssistantIaPage() {
  const options = await getAdvancedModuleOptions();
  return <AssistantView options={options} />;
}
