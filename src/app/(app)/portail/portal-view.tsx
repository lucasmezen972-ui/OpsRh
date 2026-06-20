"use client";

import { Globe, Lock, ShieldCheck, Upload, FileText, Plus, MessageSquare, Inbox } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CASE_STATUS, CLIENT_REQUEST_STATUS, CLIENT_REQUEST_TYPE, PRIORITY } from "@/lib/constants";
import type { PortalPreview } from "@/lib/supabase/portal";
import { createClientRequestAction } from "./actions";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function PortalView({ preview, isDemo }: { preview: PortalPreview; isDemo: boolean }) {
  const { client, cases, requests, missingDocs } = preview;
  const slug = (client?.name ?? "client").toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-6">
      <PageHeader title="Portail client" description="Que voit mon client ?">

      </PageHeader>

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

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b bg-muted/60 px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-red-400" />
            <span className="size-3 rounded-full bg-amber-400" />
            <span className="size-3 rounded-full bg-emerald-400" />
          </div>
          <div className="ml-2 flex flex-1 items-center gap-2 rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
            <Lock className="size-3" />
            portail.opsrh.fr/{slug}
          </div>
          <Badge variant="purple">Aperçu</Badge>
        </div>

        <div className="space-y-6 bg-muted/20 p-6">
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
                {missingDocs.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">Aucun document en attente. 🎉</p>
                ) : (
                  missingDocs.map((doc, i) => (
                    <div key={`${doc}-${i}`} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{doc}</span>
                      </div>
                      <Button size="sm" variant="outline" disabled title="Bientôt disponible : dépôt depuis l'espace client dédié.">
                        <Upload className="size-4" /> Déposer · Bientôt disponible
                      </Button>
                    </div>
                  ))
                )}
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
              </CardHeader>
              <CardContent className="space-y-3">
                {requests.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    Aucune demande en cours. Utilisez le formulaire ci-dessous pour en créer une.
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
                <form className="space-y-4" action={isDemo ? undefined : createClientRequestAction}>
                  {client && <input type="hidden" name="client_id" value={client.id} />}
                  <div className="space-y-1.5">
                    <Label htmlFor="title">Objet</Label>
                    <Input id="title" name="title" placeholder="Ex. Besoin d'une attestation de travail" required={!isDemo} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="type">Type de demande</Label>
                    <select id="type" name="type" defaultValue="besoin_document" className={selectClass}>
                      {Object.entries(CLIENT_REQUEST_TYPE).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="priority">Priorité</Label>
                    <select id="priority" name="priority" defaultValue="normale" className={selectClass}>
                      {Object.entries(PRIORITY).map(([key, meta]) => (
                        <option key={key} value={key}>
                          {meta.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" placeholder="Décrivez votre besoin…" />
                  </div>
                  <Button type="submit" className="w-full" disabled={isDemo}>
                    Envoyer la demande
                  </Button>
                  {isDemo && (
                    <p className="text-center text-xs text-muted-foreground">
                      Connectez-vous pour créer une vraie demande.
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

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
