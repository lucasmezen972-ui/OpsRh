import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SubscriptionCanceledPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Checkout annulé</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Aucun abonnement n'a été activé. Vous pouvez relancer le paiement quand vous le souhaitez.
          </p>
          <Button asChild variant="outline">
            <Link href="/tarifs">Retour aux tarifs</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
