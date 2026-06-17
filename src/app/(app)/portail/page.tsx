"use client";

import { useState } from "react";
import {
  Globe,
  Lock,
  ShieldCheck,
  Upload,
  FileText,
  Plus,
  MessageSquare,
  Inbox,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getClient, getClientCases, getClientRequests } from "@/lib/data";
import { CASE_STATUS, CLIENT_REQUEST_STATUS, CLIENT_REQUEST_TYPE, PRIORITY } from "@/lib/constants";
import type { ClientRequestType, Priority } from "@/lib/types";

const CLIENT_ID = "c1";
const MISSING_DOCS = ["RIB", "Pièce d'identité", "Contrat signé"];

export default function PortailPage() {
  const client = getClient(CLIENT_ID);
  const cases = getClientCases(CLIENT_ID);
  const requests = getClientRequests().filter((r) => r.client_id === CLIENT_ID);

  const [type, setType] = useState<ClientRequestType | "">("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [description, setDescription] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setType("");
    setPriority("");
    setDescription("");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Portail client" description="Que voit mon client ?" />

      {/* Intro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-5 text-primary" /> Un espace sécurisé pour vos clients
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Le client se connecte avec son adresse email et accède à un espace personnel. Il ne voit que ses propres
            données : ses dossiers, les documents à déposer et ses demandes en cours.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">
              <Lock className="mr-1 size-3" /> Accès par email sécurisé
            </Badge>
            <Badge variant="success">
              <ShieldCheck className="mr-1 size-3" /> Les notes internes ne sont jamais visibles ici
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Cadre d'aperçu type navigateur */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b bg-muted/60 px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-red-400" />
            <span className="size-3 rounded-full bg-amber-400" />
            <span className="size-3 rounded-full bg-emerald-400" />
          </div>
          <div className="ml-2 flex flex-1 items-center gap-2 rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
            <Lock className="size-3" />
            portail.opsrh.fr/alpha-services
          </div>
          <Badge variant="purple">Aperçu</Badge>
        </div>

        <div className="space-y-6 bg-muted/20 p-6">
          {/* En-tête client */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Espace client</p>
            <h2 className="text-xl font-semibold">Bonjour, {client?.name ?? "Client"}</h2>
            <p className="text-sm text-muted-foreground">
              Retrouvez ici vos dossiers, déposez vos documents et suivez vos demandes.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Documents à déposer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Upload className="size-4 text-primary" /> Documents à déposer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {MISSING_DOCS.map((doc) => (
                  <div key={doc} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{doc}</span>
                    </div>
                    <Button size="sm" variant="outline">
                      <Upload className="size-4" /> Déposer le document
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Dossiers en cours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="size-4 text-primary" /> Dossiers en cours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cases.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">Aucun dossier en cours.</p>
                ) : (
                  cases.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{c.title}</p>
                        {c.person_name && <p className="text-xs text-muted-foreground">{c.person_name}</p>}
                      </div>
                      <StatusBadge label={CASE_STATUS[c.status].label} tone={CASE_STATUS[c.status].tone} />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Demandes en cours */}
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Inbox className="size-4 text-primary" /> Demandes en cours
                </CardTitle>
                <Button size="sm" variant="outline">
                  <Plus className="size-4" /> Nouvelle demande
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {requests.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    Vous n&apos;avez aucune demande en cours. Utilisez le formulaire ci-dessous pour en créer une.
                  </p>
                ) : (
                  requests.map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{CLIENT_REQUEST_TYPE[r.type]}</p>
                      </div>
                      <StatusBadge label={CLIENT_REQUEST_STATUS[r.status].label} tone={CLIENT_REQUEST_STATUS[r.status].tone} />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Créer une demande */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plus className="size-4 text-primary" /> Créer une demande
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-1.5">
                    <Label htmlFor="req-type">Type de demande</Label>
                    <Select value={type} onValueChange={(v) => setType(v as ClientRequestType)}>
                      <SelectTrigger id="req-type">
                        <SelectValue placeholder="Choisir un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CLIENT_REQUEST_TYPE).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="req-priority">Priorité</Label>
                    <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                      <SelectTrigger id="req-priority">
                        <SelectValue placeholder="Choisir une priorité" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORITY).map(([key, meta]) => (
                          <SelectItem key={key} value={key}>
                            {meta.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="req-description">Description</Label>
                    <Textarea
                      id="req-description"
                      placeholder="Décrivez votre besoin…"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Envoyer la demande
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Commentaires récents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="size-4 text-primary" /> Commentaires récents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="py-4 text-center text-sm text-muted-foreground">
                Les échanges partagés avec votre consultant apparaîtront ici.
              </p>
            </CardContent>
          </Card>

          <Separator />
          <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-emerald-600" />
            Les notes internes de votre consultant ne sont jamais visibles dans cet espace.
          </p>
        </div>
      </Card>
    </div>
  );
}
