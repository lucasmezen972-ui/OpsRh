import { createClient, isSupabaseConfigured } from "./server";

export type ClientStatus = "actif" | "en_pause" | "termine";

export interface ClientListItem {
  id: string;
  name: string;
  sector: string | null;
  main_contact_name: string | null;
  main_contact_email: string | null;
  status: ClientStatus;
  active_cases_count: number;
  missing_docs_count: number;
  minutes_this_month: number;
  billable_this_month: number;
}

const ACTIVE_CASE_STATES = ["nouveau", "en_cours", "en_attente_client", "a_completer", "bloque", "a_valider"];
const MISSING_DOC_STATES = ["demande", "a_corriger", "expire"];

function firstDayOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function addToMap(map: Map<string, number>, key: string | null | undefined, value = 1) {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + value);
}

/**
 * Returns null when Supabase is not configured or when no user session exists.
 * The UI can then keep using the demo dataset without breaking local exploration.
 */
export async function getSupabaseClientList(): Promise<ClientListItem[] | null> {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select("id,name,sector,main_contact_name,main_contact_email,status,updated_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  if (clientsError) throw new Error(`Impossible de charger les clients : ${clientsError.message}`);
  if (!clients?.length) return [];

  const clientIds = clients.map((client) => client.id);

  const [{ data: cases }, { data: checklists }, { data: timeEntries }] = await Promise.all([
    supabase.from("hr_cases").select("id,client_id,status").in("client_id", clientIds),
    supabase.from("document_checklists").select("id,client_id,hr_case_id").in("client_id", clientIds),
    supabase
      .from("time_entries")
      .select("client_id,duration_minutes,billable,hourly_rate,date")
      .in("client_id", clientIds)
      .gte("date", firstDayOfCurrentMonth()),
  ]);

  const activeCasesByClient = new Map<string, number>();
  for (const hrCase of cases ?? []) {
    if (ACTIVE_CASE_STATES.includes(hrCase.status)) {
      addToMap(activeCasesByClient, hrCase.client_id);
    }
  }

  const checklistIds = (checklists ?? []).map((checklist) => checklist.id);
  const checklistClientById = new Map<string, string>();
  for (const checklist of checklists ?? []) {
    if (checklist.client_id) checklistClientById.set(checklist.id, checklist.client_id);
  }

  const missingDocsByClient = new Map<string, number>();
  if (checklistIds.length > 0) {
    const { data: missingItems, error: missingItemsError } = await supabase
      .from("checklist_items")
      .select("checklist_id,status")
      .in("checklist_id", checklistIds)
      .in("status", MISSING_DOC_STATES);

    if (missingItemsError) throw new Error(`Impossible de charger les documents manquants : ${missingItemsError.message}`);

    for (const item of missingItems ?? []) {
      addToMap(missingDocsByClient, checklistClientById.get(item.checklist_id));
    }
  }

  const minutesByClient = new Map<string, number>();
  const billableByClient = new Map<string, number>();
  for (const entry of timeEntries ?? []) {
    addToMap(minutesByClient, entry.client_id, entry.duration_minutes ?? 0);
    if (entry.billable) {
      addToMap(billableByClient, entry.client_id, ((entry.duration_minutes ?? 0) / 60) * Number(entry.hourly_rate ?? 0));
    }
  }

  return clients.map((client) => ({
    id: client.id,
    name: client.name,
    sector: client.sector,
    main_contact_name: client.main_contact_name,
    main_contact_email: client.main_contact_email,
    status: client.status as ClientStatus,
    active_cases_count: activeCasesByClient.get(client.id) ?? 0,
    missing_docs_count: missingDocsByClient.get(client.id) ?? 0,
    minutes_this_month: minutesByClient.get(client.id) ?? 0,
    billable_this_month: billableByClient.get(client.id) ?? 0,
  }));
}
