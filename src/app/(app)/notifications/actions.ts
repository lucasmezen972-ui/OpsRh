"use server";

import { redirect } from "next/navigation";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/supabase/notification-mutations";

export async function markNotificationReadAction(id: string) {
  const result = await markNotificationRead(id);
  if (!result.ok && result.reason === "unauthenticated") redirect("/login");
  return result;
}

export async function markAllNotificationsReadAction() {
  const result = await markAllNotificationsRead();
  if (!result.ok && result.reason === "unauthenticated") redirect("/login");
  return result;
}
