import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import { APP_CONFIG } from "@/lib/app-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EspaceClientPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Espace client Ops RH</CardTitle>
            <Badge variant="info">
              <Lock className="mr-1 size-3" /> Accès sécurisé
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Le portail client production nécessite une invitation ou un magic link envoyé par votre consultant RH.
          </p>
          <p className="flex items-center gap-2 text-sm">
            <ShieldCheck className="size-4 text-emerald-600" />
            Les notes internes ne sont jamais exposées au client.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/login">Connexion consultant</Link>
            </Button>
            <Button asChild variant="outline">
              <a href={`mailto:${APP_CONFIG.contactEmail}`}>Contacter le support</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
