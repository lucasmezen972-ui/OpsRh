import { FileText, Inbox, Lock, MessageSquare, ShieldCheck, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCases, getClientRequests, getClients, missingChecklistItems } from "@/lib/data";
import { CASE_STATUS, CLIENT_REQUEST_STATUS, CLIENT_REQUEST_TYPE } from "@/lib/constants";

export default function EspaceClientPage() {
  const client = getClients()[0];
  const cases = getCases().filter((item) => item.client_id === client.id);
  const requests = getClientRequests().filter((item) => item.client_id === client.id);
  const missingDocs = missingChecklistItems().slice(0, 4);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Ops RH</p>
            <h1 className="text-xl font-semibold">Espace client</h1>
          </div>
          <Badge variant="info">
            <Lock className="mr-1 size-3" /> Accès sécurisé
          </Badge>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardContent className="flex flex-col gap-2 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Bonjour, {client.name}</h2>
              <p className="text-sm text-muted-foreground">
                Vous voyez uniquement vos dossiers, vos documents demandés et vos demandes partagées.
              </p>
            </div>
            <Badge variant="success">
              <ShieldCheck className="mr-1 size-3" /> Notes internes masquées
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="size-4" /> Documents demandés
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {missingDocs.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <span className="text-sm font-medium">{item.name}</span>
                <Button size="sm" variant="outline" disabled title="Bientôt disponible : dépôt connecté au Storage du portail.">
                  Déposer · Bientôt disponible
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" /> Dossiers autorisés
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cases.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <span className="truncate text-sm font-medium">{item.title}</span>
                <Badge variant={CASE_STATUS[item.status].tone}>{CASE_STATUS[item.status].label}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Inbox className="size-4" /> Mes demandes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{CLIENT_REQUEST_TYPE[item.type]}</p>
                </div>
                <Badge variant={CLIENT_REQUEST_STATUS[item.status].tone}>{CLIENT_REQUEST_STATUS[item.status].label}</Badge>
              </div>
            ))}
            <Button disabled title="Bientôt disponible : création de demande avec session client.">
              Créer une demande · Bientôt disponible
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="size-4" /> Commentaires partagés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Les commentaires visibles client apparaîtront ici. Les notes internes ne sont jamais exposées.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
