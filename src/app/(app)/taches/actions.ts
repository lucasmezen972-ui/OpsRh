"use server";

import { redirect } from "next/navigation";
import {
  completeTaskRecord,
  createTaskRecord,
  deleteTaskRecord,
  postponeTaskRecord,
  type CreateTaskInput,
} from "@/lib/supabase/task-mutations";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item : "";
}

export async function createTaskAction(formData: FormData) {
  const estimated = value(formData, "estimated_minutes");
  const input: CreateTaskInput = {
    title: value(formData, "title"),
    client_id: value(formData, "client_id"),
    hr_case_id: value(formData, "hr_case_id"),
    description: value(formData, "description"),
    type: value(formData, "type") as CreateTaskInput["type"],
    status: value(formData, "status") as CreateTaskInput["status"],
    priority: value(formData, "priority") as CreateTaskInput["priority"],
    due_date: value(formData, "due_date"),
    estimated_minutes: estimated ? Number(estimated) : null,
  };

  const result = await createTaskRecord(input);
  if (!result.ok && result.reason === "unauthenticated") redirect("/login");
  if (!result.ok) redirect(`/taches?error=${encodeURIComponent(result.message)}`);
  redirect("/taches");
}

export async function completeTaskAction(id: string) {
  const result = await completeTaskRecord(id);
  if (!result.ok && result.reason === "unauthenticated") redirect("/login");
  return result;
}

export async function postponeTaskAction(id: string) {
  const result = await postponeTaskRecord(id, 1);
  if (!result.ok && result.reason === "unauthenticated") redirect("/login");
  return result;
}

export async function deleteTaskAction(id: string) {
  const result = await deleteTaskRecord(id);
  if (!result.ok && result.reason === "unauthenticated") redirect("/login");
  return result;
}
