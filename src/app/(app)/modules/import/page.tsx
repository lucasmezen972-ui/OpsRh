import { getAdvancedModuleOptions } from "@/lib/supabase/advanced-modules";
import { ImportView } from "./view";

export default async function ImportPage() {
  const options = await getAdvancedModuleOptions();
  return <ImportView options={options} />;
}
