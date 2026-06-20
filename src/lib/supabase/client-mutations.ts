import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "./server";

export type CreateClientInput = {
  name: string;
  sector?: string | null;
  address?: string | null;
  siret?: string | null;
  main_contact_name?: string | null;
  main_contact_email?: string | null;
  main_contact_phone?: string | null;
  status?: "actif" | "en_pause" | "termine";
  collaboration_type?: string | null;
  collaboration_start_date?: string | null;
  notes?: string | null;
};

export type CreateClientResult =
  | { ok: true; clientId: string }
  | { ok: false; reason: "demo_mode" | "unauthenticated" | "validation" | "database"; message: string };

function clean(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createClientRecord(input: CreateClientInput): Promise<CreateClientResult> {
  const supabase = createClient();

  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      reason: "demo_mode",
      message: "Supabase n'est pas configuré. Le client n'a pas été enregistré.",
    };
  }

  const name = clean(input.name);
  if (!name) {
    return {
      ok: false,
      reason: "validation",
      message: "Le nom de l'entreprise est obligatoire.",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      reason: "unauthenticated",
      message: "Vous devez être connecté pour créer un client.",
    };
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      owner_id: user.id,
      name,
      sector: clean(input.sector),
      address: clean(input.address),
      siret: clean(input.siret),
      main_contact_name: clean(input.main_contact_name),
      main_contact_email: clean(input.main_contact_email),
      main_contact_phone: clean(input.main_contact_phone),
      status: input.status ?? "actif",
      collaboration_type: clean(input.collaboration_type),
      collaboration_start_date: clean(input.collaboration_start_date),
      notes: clean(input.notes),
    })
    .select("id")
    .single();

  if (clientError || !client) {
    return {
      ok: false,
      reason: "database",
      message: clientError?.message ?? "Impossible de créer le client.",
    };
  }

  const contactName = clean(input.main_contact_name);
  const contactEmail = clean(input.main_contact_email);
  const contactPhone = clean(input.main_contact_phone);

  if (contactName || contactEmail || contactPhone) {
    await supabase.from("client_contacts").insert({
      client_id: client.id,
      name: contactName ?? "Contact principal",
      email: contactEmail,
      phone: contactPhone,
      role: "Contact principal",
      portal_access: false,
    });
  }

  await supabase.from("activity_logs").insert({
    owner_id: user.id,
    client_id: client.id,
    action_type: "client_cree",
    description: `Client créé : ${name}`,
    actor_id: user.id,
  });

  revalidatePath("/clients");

  return { ok: true, clientId: client.id };
}

export async function updateClientRecord(
  clientId: string,
  input: CreateClientInput
): Promise<CreateClientResult> {
  const supabase = createClient();

  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, reason: "demo_mode", message: "Supabase n'est pas configuré. Modification non enregistrée." };
  }

  const name = clean(input.name);
  if (!name) {
    return { ok: false, reason: "validation", message: "Le nom de l'entreprise est obligatoire." };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, reason: "unauthenticated", message: "Vous devez être connecté pour modifier un client." };
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .update({
      name,
      sector: clean(input.sector),
      address: clean(input.address),
      siret: clean(input.siret),
      main_contact_name: clean(input.main_contact_name),
      main_contact_email: clean(input.main_contact_email),
      main_contact_phone: clean(input.main_contact_phone),
      status: input.status ?? "actif",
      collaboration_type: clean(input.collaboration_type),
      collaboration_start_date: clean(input.collaboration_start_date),
      notes: clean(input.notes),
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId)
    .eq("owner_id", user.id)
    .select("id")
    .single();

  if (clientError || !client) {
    return { ok: false, reason: "database", message: clientError?.message ?? "Impossible de modifier le client." };
  }

  await supabase.from("activity_logs").insert({
    owner_id: user.id,
    client_id: client.id,
    action_type: "client_maj",
    description: `Client mis à jour : ${name}`,
    actor_id: user.id,
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${client.id}`);

  return { ok: true, clientId: client.id };
}
