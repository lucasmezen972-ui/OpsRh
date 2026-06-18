"use server";

import { redirect } from "next/navigation";
import { createClientRequestRecord, type CreateClientRequestInput } from "@/lib/supabase/portal-mutations";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item : "";
}

export async function createClientRequestAction(formData: FormData) {
  const input: CreateClientRequestInput = {
    client_id: value(formData, "client_id"),
    title: value(formData, "title"),
    type: value(formData, "type") as CreateClientRequestInput["type"],
    priority: value(formData, "priority") as CreateClientRequestInput["priority"],
    description: value(formData, "description"),
  };

  const result = await createClientRequestRecord(input);
  if (!result.ok && result.reason === "unauthenticated") redirect("/login");
  redirect("/portail");
}
