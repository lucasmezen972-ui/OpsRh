"use server";

import { APP_CONFIG } from "@/lib/app-config";
import { sendTransactionalEmail } from "@/lib/email/server";

export type ContactResult = { ok: boolean; message: string };

export async function sendContactMessage(_prev: ContactResult | undefined, formData: FormData): Promise<ContactResult> {
  const website = String(formData.get("website") ?? "");
  if (website) return { ok: true, message: "Message reçu." };

  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const consent = formData.get("consent") === "on";

  if (!email || !subject || message.length < 10 || !consent) {
    return { ok: false, message: "Tous les champs sont obligatoires et le message doit être détaillé." };
  }

  await sendTransactionalEmail({
    to: APP_CONFIG.contactEmail,
    subject: `[Ops RH] ${subject}`,
    html: `<p><strong>De :</strong> ${escapeHtml(email)}</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
    idempotencyKey: `contact-${email}-${subject}-${message.length}`,
  });

  return { ok: true, message: "Votre message a bien été transmis à Ops RH." };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char] ?? char));
}
