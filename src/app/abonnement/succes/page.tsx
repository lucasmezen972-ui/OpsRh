import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SubscriptionSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Checkout terminé</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Merci. L'activation finale de l'abonnement est confirmée par le webhook Stripe.
          </p>
          <Button asChild>
            <Link href="/dashboard">Retour au dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
