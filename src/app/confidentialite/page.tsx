import { APP_CONFIG } from "@/lib/app-config";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-semibold">Politique de confidentialité</h1>
      <p className="text-sm text-muted-foreground">Version provisoire à faire relire juridiquement.</p>
      <section className="space-y-3 text-sm leading-6">
        <p>Ops RH traite des données nécessaires au pilotage RH : comptes utilisateurs, clients, dossiers, documents, tâches, temps passé, demandes client et informations d'abonnement.</p>
        <p>Les services utilisés sont Supabase pour l'authentification, la base de données et le stockage, Stripe pour les paiements, Vercel pour l'hébergement et Resend pour les e-mails transactionnels.</p>
        <p>Les documents RH sont stockés dans des buckets privés. Les accès sont limités par authentification, organisation et politiques RLS.</p>
        <p>Vous pouvez demander l'accès, la rectification, l'export ou la suppression de vos données à <a className="text-primary hover:underline" href={`mailto:${APP_CONFIG.contactEmail}`}>{APP_CONFIG.contactEmail}</a>.</p>
      </section>
    </main>
  );
}
