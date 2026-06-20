import { getAdvancedModuleOptions } from "@/lib/supabase/advanced-modules";
import { SignatureView } from "./view";

export default async function SignaturePage() {
  const options = await getAdvancedModuleOptions();
  return <SignatureView isDemo={options.isDemo} />;
}
