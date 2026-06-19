import { getProfile } from "@/lib/data";
import { getSessionContext } from "@/lib/supabase/session";
import { DEFAULT_USER_SETTINGS, getUserSettings } from "@/lib/supabase/settings";
import { ParametresView } from "./parametres-view";

export default async function ParametresPage() {
  const session = await getSessionContext();
  const profile = session?.profile ?? getProfile();
  const settings = (await getUserSettings()) ?? DEFAULT_USER_SETTINGS;
  return <ParametresView profile={profile} settings={settings} isDemo={session === null} />;
}
