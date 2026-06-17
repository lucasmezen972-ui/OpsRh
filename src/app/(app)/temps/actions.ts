"use server";

import { redirect } from "next/navigation";
import {
  createTimeEntryRecord,
  deleteTimeEntryRecord,
  type CreateTimeEntryInput,
} from "@/lib/supabase/time-mutations";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item : "";
}

export async function createTimeEntryAction(formData: FormData) {
  const minutes = Number(value(formData, "duration_minutes"));
  const rate = value(formData, "hourly_rate");
  const input: CreateTimeEntryInput = {
    client_id: value(formData, "client_id"),
    hr_case_id: value(formData, "hr_case_id"),
    date: value(formData, "date"),
    duration_minutes: Number.isFinite(minutes) ? minutes : 0,
    description: value(formData, "description"),
    billable: formData.get("billable") != null,
    hourly_rate: rate ? Number(rate) : null,
  };

  const result = await createTimeEntryRecord(input);
  if (!result.ok && result.reason === "unauthenticated") redirect("/login");
  redirect("/temps");
}

export async function deleteTimeEntryAction(id: string) {
  const result = await deleteTimeEntryRecord(id);
  if (!result.ok && result.reason === "unauthenticated") redirect("/login");
}
