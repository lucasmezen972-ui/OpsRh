import { getSubscriptionAccess } from "@/lib/auth/access";
import { APP_CONFIG } from "@/lib/app-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortalButton } from "./portal-button";

export default async function SubscriptionPage() {
  const subscription = await getSubscriptionAccess();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Abonnement</h1>
        <p className="text-sm text-muted-foreground">Gérez votre accès Ops RH Pro.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Ops RH Pro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Statut</dt>
              <dd className="font-medium">{subscription.status}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Fin d'essai</dt>
              <dd className="font-medium">{subscription.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString("fr-FR") : "Non applicable"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Prochaine échéance</dt>
              <dd className="font-medium">{subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString("fr-FR") : "Non disponible"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Résiliation programmée</dt>
              <dd className="font-medium">{subscription.cancelAtPeriodEnd ? "Oui" : "Non"}</dd>
            </div>
          </dl>

          {subscription.reason && <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">{subscription.reason}</p>}

          <PortalButton />
          <p className="text-sm text-muted-foreground">
            Support : <a className="text-primary hover:underline" href={`mailto:${APP_CONFIG.contactEmail}`}>{APP_CONFIG.contactEmail}</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
