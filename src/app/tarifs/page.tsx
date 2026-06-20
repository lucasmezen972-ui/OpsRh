import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { APP_CONFIG } from "@/lib/app-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckoutButtons } from "./checkout-buttons";

const FEATURES = [
  "Clients, dossiers RH, tâches et documents sécurisés",
  "Téléversement privé Supabase Storage",
  "Pré-facturation et PDF",
  "Portail client",
  "Recherche globale et notifications",
  "Support par e-mail",
];

export default function PricingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-4 py-10">
      <header className="space-y-3 text-center">
        <p className="text-sm font-medium text-primary">Ops RH Pro</p>
        <h1 className="text-3xl font-semibold tracking-tight">14 jours d'essai, puis abonnement Pro</h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Une seule offre pour lancer Ops RH en production. Les montants exacts sont configurés dans Stripe.
        </p>
      </header>

      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Ops RH Pro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="font-medium">Mensuel</p>
              <p className="text-sm text-muted-foreground">Facturation mensuelle via Stripe.</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Annuel</p>
              <p className="text-sm text-muted-foreground">Facturation annuelle via Stripe.</p>
            </div>
          </div>

          <ul className="grid gap-2">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 text-emerald-600" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <CheckoutButtons />

          <p className="text-sm text-muted-foreground">
            Résiliation possible depuis le portail Stripe. Les données restent conservées après résiliation.
            Support : <a className="text-primary hover:underline" href={`mailto:${APP_CONFIG.contactEmail}`}>{APP_CONFIG.contactEmail}</a>.
          </p>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Puis-je annuler ?", "Oui, depuis le portail client Stripe. L'accès reste ouvert jusqu'à la fin de la période payée."],
          ["Le prix vient-il du navigateur ?", "Non. Les Price ID autorisés sont lus côté serveur depuis les variables Stripe."],
          ["Besoin d'aide ?", `Contactez ${APP_CONFIG.contactEmail}.`],
        ].map(([title, body]) => (
          <Card key={title}>
            <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">{body}</CardContent>
          </Card>
        ))}
      </section>

      <Link href="/login" className="text-center text-sm text-primary hover:underline">
        Retour à la connexion
      </Link>
    </main>
  );
}
