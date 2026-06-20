export const APP_CONFIG = {
  name: "Ops RH",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://ops-rh.vercel.app",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? process.env.CONTACT_EMAIL ?? "contact@tradikom.com",
  resendFromEmail: process.env.RESEND_FROM_EMAIL ?? "Ops RH <contact@tradikom.com>",
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024),
} as const;

export const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/tarifs",
  "/confidentialite",
  "/mentions-legales",
  "/contact",
] as const;

export const STRIPE_ALLOWED_STATUSES = new Set(["trialing", "active"]);
