"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FileText, FileWarning, CheckCircle2, AlertTriangle, Plus, Mail, Download, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DOCUMENT_STATUS, DOCUMENT_TYPE } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { DocumentBoard } from "@/lib/supabase/documents";
import {
  createDocumentAction,
  deleteDocumentAction,
  getDocumentDownloadUrlAction,
  setChecklistItemStatusAction,
  updateDocumentStatusAction,
} from "./actions";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function DocumentsView({
  board,
  clientOptions,
  caseOptions,
  isDemo,
}: {
  board: DocumentBoard;
  clientOptions: { id: string; name: string }[];
  caseOptions: { id: string; title: string }[];
  isDemo: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function runDocumentAction(action: () => Promise<{ ok: true } | { ok: false; message: string }>) {
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? "Action enregistrée." : result.message);
    });
  }

  async function downloadDocument(id: string) {
    const result = await getDocumentDownloadUrlAction(id);
    if (result.ok) {
      window.open(result.url, "_blank", "noopener,noreferrer");
      setMessage("Lien de téléchargement ouvert.");
    } else {
      setMessage(result.message);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" description="Qu'est-ce qui manque ?">
        {isDemo && <Badge variant="warning">Mode démo</Badge>}
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> Ajouter un document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un document</DialogTitle>
              <DialogDescription>
                {isDemo
                  ? "Connectez-vous à Supabase pour enregistrer réellement vos documents."
                  : "Référencez un document et rattachez-le à un client ou un dossier."}
              </DialogDescription>
            </DialogHeader>
            <form action={createDocumentAction} className="space-y-4" encType="multipart/form-data">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du document</Label>
                <Input id="name" name="name" placeholder="Ex. RIB - Clara Martin.pdf" required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="document_type">Type</Label>
                  <select id="document_type" name="document_type" defaultValue="autre" className={selectClass}>
                    {Object.entries(DOCUMENT_TYPE).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <select id="status" name="status" defaultValue="recu" className={selectClass}>
                    {Object.entries(DOCUMENT_STATUS).map(([value, meta]) => (
                      <option key={value} value={value}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="client_id">Client</Label>
                  <select id="client_id" name="client_id" defaultValue="" className={selectClass}>
                    <option value="">—</option>
                    {clientOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hr_case_id">Dossier</Label>
                  <select id="hr_case_id" name="hr_case_id" defaultValue="" className={selectClass}>
                    <option value="">—</option>
                    {caseOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiration_date">Date d&apos;expiration (optionnel)</Label>
                <Input id="expiration_date" name="expiration_date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">Fichier</Label>
                <Input id="file" name="file" type="file" accept="application/pdf,image/png,image/jpeg" required={!isDemo} />
                <p className="text-xs text-muted-foreground">PDF, PNG, JPG ou JPEG. Taille maximum : 10 Mo.</p>
              </div>
              <Button type="submit" className="w-full">
                Enregistrer le document
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>
      {message && (
        <p role="status" className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
          {message}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total documents" value={board.total} icon={<FileText />} tone="info" />
        <StatCard label="Manquants" value={board.missing} icon={<FileWarning />} tone="warning" />
        <StatCard label="Validés" value={board.validated} icon={<CheckCircle2 />} tone="success" />
        <StatCard label="À corriger / expirés" value={board.toFix} icon={<AlertTriangle />} tone="danger" />
      </div>

      <Tabs defaultValue="all">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="all">Tous les documents</TabsTrigger>
          <TabsTrigger value="missing">Documents manquants</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {board.documents.length === 0 ? (
            <EmptyState icon={<FileText />} title="Aucun document" description="Les documents de vos dossiers apparaîtront ici." />
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Dossier</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date d&apos;ajout</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {board.documents.map((doc) => {
                    const status = DOCUMENT_STATUS[doc.status];
                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell className="text-sm">{DOCUMENT_TYPE[doc.document_type]}</TableCell>
                        <TableCell className="text-sm">{doc.client_name ?? "—"}</TableCell>
                        <TableCell className="text-sm">{doc.case_title ?? "—"}</TableCell>
                        <TableCell>
                          <StatusBadge label={status.label} tone={status.tone} />
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(doc.created_at)}</TableCell>
                        <TableCell className="text-sm">
                          {doc.expiration_date ? formatDate(doc.expiration_date) : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Télécharger"
                              disabled={!doc.file_url || isDemo || pending}
                              title={!doc.file_url ? "Aucun fichier associé" : isDemo ? "Connectez-vous pour télécharger" : undefined}
                              onClick={() => downloadDocument(doc.id)}
                            >
                              <Download className="size-4" />
                            </Button>
                            {!isDemo && (
                              <>
                                <select
                                  aria-label={`Statut de ${doc.name}`}
                                  defaultValue={doc.status}
                                  disabled={pending}
                                  className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                                  onChange={(event) =>
                                    runDocumentAction(() =>
                                      updateDocumentStatusAction(doc.id, event.target.value as typeof doc.status)
                                    )
                                  }
                                >
                                  {Object.entries(DOCUMENT_STATUS).map(([value, meta]) => (
                                    <option key={value} value={value}>
                                      {meta.label}
                                    </option>
                                  ))}
                                </select>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Supprimer"
                                  disabled={pending}
                                  onClick={() => {
                                    if (window.confirm("Supprimer ce document et son fichier associé ?")) {
                                      runDocumentAction(() => deleteDocumentAction(doc.id));
                                    }
                                  }}
                                >
                                  <Trash2 className="size-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="missing" className="space-y-4">
          {board.groups.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 />}
              title="Aucun document manquant 🎉"
              description="Tous les documents attendus ont été reçus ou validés."
            />
          ) : (
            board.groups.map((group) => (
              <Card key={group.client_id}>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileWarning className="size-5 text-amber-600" />
                    {group.client_name}
                    <Badge variant="warning">
                      {group.items.length} manquant{group.items.length > 1 ? "s" : ""}
                    </Badge>
                  </CardTitle>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/mails?clientId=${group.client_id}&type=relance_documents`}>
                      <Mail className="size-4" /> Générer une relance groupée
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y">
                    {group.items.map((item) => (
                      <li key={item.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium">{item.name}</p>
                            {item.required ? <Badge variant="danger">Requis</Badge> : <Badge variant="neutral">Optionnel</Badge>}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {item.case_title ? `${item.case_title} · ` : ""}demandé depuis {item.days} jours
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <StatusBadge label={DOCUMENT_STATUS[item.status].label} tone={DOCUMENT_STATUS[item.status].tone} />
                          {!isDemo && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={pending}
                                onClick={() =>
                                  startTransition(() => {
                                    void setChecklistItemStatusAction(item.id, "recu");
                                  })
                                }
                              >
                                Marquer reçu
                              </Button>
                              <Button
                                size="sm"
                                disabled={pending}
                                onClick={() =>
                                  startTransition(() => {
                                    void setChecklistItemStatusAction(item.id, "valide");
                                  })
                                }
                              >
                                Valider
                              </Button>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
