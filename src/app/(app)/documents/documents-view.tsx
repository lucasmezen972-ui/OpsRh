"use client";

import { useTransition } from "react";
import Link from "next/link";
import { FileText, FileWarning, CheckCircle2, AlertTriangle, Plus, Mail } from "lucide-react";
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
import { createDocumentAction, setChecklistItemStatusAction } from "./actions";

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
            <form action={createDocumentAction} className="space-y-4">
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
              <Button type="submit" className="w-full">
                Enregistrer le document
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

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
                    <Link href="/mails">
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
                                onClick={() => startTransition(() => setChecklistItemStatusAction(item.id, "recu"))}
                              >
                                Marquer reçu
                              </Button>
                              <Button
                                size="sm"
                                disabled={pending}
                                onClick={() => startTransition(() => setChecklistItemStatusAction(item.id, "valide"))}
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
