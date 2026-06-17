"use client";

import Link from "next/link";
import {
  FileText,
  FileWarning,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Mail,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  getCase,
  getChecklists,
  getClient,
  getDocuments,
  missingChecklistItems,
} from "@/lib/data";
import { DOCUMENT_STATUS, DOCUMENT_TYPE } from "@/lib/constants";
import { daysSince, formatDate } from "@/lib/utils";
import type { ChecklistItem, Client } from "@/lib/types";

interface MissingItem {
  item: ChecklistItem;
  caseTitle: string | null;
  days: number;
}

export default function DocumentsPage() {
  const documents = getDocuments();
  const missing = missingChecklistItems();
  const validated = documents.filter((d) => d.status === "valide").length;
  const toFix = documents.filter((d) => d.status === "a_corriger" || d.status === "expire").length;

  // Regroupe les documents manquants par client.
  const groups = new Map<string, { client: Client | null; items: MissingItem[] }>();
  for (const item of missing) {
    const checklist = getChecklists().find((c) => c.id === item.checklist_id);
    const hrCase = checklist?.hr_case_id ? getCase(checklist.hr_case_id) : null;
    const client = hrCase ? getClient(hrCase.client_id) : null;
    const key = client?.id ?? "sans-client";
    if (!groups.has(key)) groups.set(key, { client, items: [] });
    groups.get(key)!.items.push({ item, caseTitle: hrCase?.title ?? null, days: daysSince(item.created_at) });
  }
  const clientGroups = Array.from(groups.values());

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" description="Qu'est-ce qui manque ?">
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
                L&apos;import de documents sera bientôt disponible. Vous pourrez téléverser un fichier,
                choisir son type et le rattacher à un client ou un dossier.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total documents" value={documents.length} icon={<FileText />} tone="info" />
        <StatCard label="Manquants" value={missing.length} icon={<FileWarning />} tone="warning" />
        <StatCard label="Validés" value={validated} icon={<CheckCircle2 />} tone="success" />
        <StatCard label="À corriger / expirés" value={toFix} icon={<AlertTriangle />} tone="danger" />
      </div>

      <Tabs defaultValue="all">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="all">Tous les documents</TabsTrigger>
          <TabsTrigger value="missing">Documents manquants</TabsTrigger>
        </TabsList>

        {/* Tous les documents */}
        <TabsContent value="all">
          {documents.length === 0 ? (
            <EmptyState
              icon={<FileText />}
              title="Aucun document"
              description="Les documents de vos dossiers apparaîtront ici."
            />
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
                  {documents.map((doc) => {
                    const client = doc.client_id ? getClient(doc.client_id) : null;
                    const hrCase = doc.hr_case_id ? getCase(doc.hr_case_id) : null;
                    const status = DOCUMENT_STATUS[doc.status];
                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell className="text-sm">{DOCUMENT_TYPE[doc.document_type]}</TableCell>
                        <TableCell className="text-sm">{client?.name ?? "—"}</TableCell>
                        <TableCell className="text-sm">{hrCase?.title ?? "—"}</TableCell>
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

        {/* Documents manquants */}
        <TabsContent value="missing" className="space-y-4">
          {clientGroups.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 />}
              title="Aucun document manquant 🎉"
              description="Tous les documents attendus ont été reçus ou validés."
            />
          ) : (
            clientGroups.map(({ client, items }) => (
              <Card key={client?.id ?? "sans-client"}>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileWarning className="size-5 text-amber-600" />
                    {client?.name ?? "Sans client"}
                    <Badge variant="warning">{items.length} manquant{items.length > 1 ? "s" : ""}</Badge>
                  </CardTitle>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/mails">
                      <Mail className="size-4" /> Générer une relance groupée
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y">
                    {items.map(({ item, caseTitle, days }) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium">{item.name}</p>
                            {item.required ? (
                              <Badge variant="danger">Requis</Badge>
                            ) : (
                              <Badge variant="neutral">Optionnel</Badge>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {caseTitle ? `${caseTitle} · ` : ""}demandé depuis {days} jours
                          </p>
                        </div>
                        <StatusBadge
                          label={DOCUMENT_STATUS[item.status].label}
                          tone={DOCUMENT_STATUS[item.status].tone}
                        />
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
