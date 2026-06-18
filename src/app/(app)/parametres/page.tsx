import { getProfile } from "@/lib/data";
import { getSessionContext } from "@/lib/supabase/session";
import { ParametresView } from "./parametres-view";

export default async function ParametresPage() {
  const session = await getSessionContext();
  const profile = session?.profile ?? getProfile();
  return <ParametresView profile={profile} isDemo={session === null} />;
}
