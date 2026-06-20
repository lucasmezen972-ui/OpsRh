import { Resend } from "resend";
import { APP_CONFIG } from "@/lib/app-config";

let resendClient: Resend | null = null;

export function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

export async function sendTransactionalEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
  idempotencyKey?: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY absente : e-mail transactionnel non envoyé.");
    return { ok: false, message: "Service e-mail non configuré." };
  }

  const { data, error } = await resend.emails.send(
    {
      from: APP_CONFIG.resendFromEmail,
      replyTo: APP_CONFIG.contactEmail,
      to: input.to,
      subject: input.subject,
      html:
        input.html +
        `<hr><p style="font-size:13px;color:#64748b">Besoin d'aide ? Contactez-nous à <a href="mailto:${APP_CONFIG.contactEmail}">${APP_CONFIG.contactEmail}</a>.</p>`,
    },
    input.idempotencyKey ? { headers: { "Idempotency-Key": input.idempotencyKey } } : undefined
  );

  if (error) {
    console.error("Erreur Resend", error);
    return { ok: false, message: "E-mail non envoyé." };
  }

  return { ok: true, id: data?.id };
}
