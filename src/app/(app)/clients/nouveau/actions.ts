"use server";

import { redirect } from "next/navigation";
import { createClientRecord, type CreateClientInput } from "@/lib/supabase/client-mutations";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item : "";
}

export async function createClientAction(formData: FormData) {
  const input: CreateClientInput = {
    name: value(formData, "name"),
    sector: value(formData, "sector"),
    address: value(formData, "address"),
    siret: value(formData, "siret"),
    main_contact_name: value(formData, "main_contact_name"),
    main_contact_email: value(formData, "main_contact_email"),
    main_contact_phone: value(formData, "main_contact_phone"),
    status: value(formData, "status") as CreateClientInput["status"],
    collaboration_type: value(formData, "collaboration_type"),
    collaboration_start_date: value(formData, "collaboration_start_date"),
    notes: value(formData, "notes"),
  };

  const result = await createClientRecord(input);

  if (!result.ok && result.reason === "unauthenticated") {
    redirect("/login");
  }

  redirect("/clients");
}
