import { APP_CONFIG } from "@/lib/app-config";

export default function LegalPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-semibold">Mentions légales</h1>
      <p className="text-sm text-muted-foreground">Structure provisoire à compléter avant mise en production commerciale.</p>
      <section className="space-y-3 text-sm leading-6">
        <p><strong>Nom du service :</strong> Ops RH.</p>
        <p><strong>Éditeur :</strong> [À compléter : raison sociale / entrepreneur individuel / forme juridique].</p>
        <p><strong>Adresse :</strong> [À compléter].</p>
        <p><strong>Responsable de publication :</strong> [À compléter].</p>
        <p><strong>Contact :</strong> <a className="text-primary hover:underline" href={`mailto:${APP_CONFIG.contactEmail}`}>{APP_CONFIG.contactEmail}</a>.</p>
        <p><strong>Hébergement :</strong> Vercel Inc. [adresse complète à vérifier].</p>
        <p><strong>Paiements :</strong> Stripe Payments Europe, Ltd. [information à vérifier selon le compte Stripe].</p>
      </section>
    </main>
  );
}
