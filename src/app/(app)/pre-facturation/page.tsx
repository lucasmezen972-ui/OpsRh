"use client";

import { useState } from "react";
import { Euro, FileText, CheckCircle2, ClipboardList, FileDown, Info } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  clientBillableAmount,
  clientMinutesThisMonth,
  getClient,
  getClients,
  getPreInvoices,
  totalBillableThisMonth,
} from "@/lib/data";
import type { PreInvoice } from "@/lib/types";
import { PRE_INVOICE_STATUS } from "@/lib/constants";
import { formatDate, formatDuration, formatEuro } from "@/lib/utils";

export default function PreFacturationPage() {
  const preInvoices = getPreInvoices();
  const clients = getClients();
  const [active, setActive] = useState<PreInvoice | null>(null);

  const aPreparer = preInvoices.filter((p) => p.status === "a_preparer").length;
  const aVerifier = preInvoices.filter((p) => p.status === "a_verifier").length;
  const pretes = preInvoices.filter((p) => p.status === "prete").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Pré-facturation" description="Que dois-je facturer ?" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total pré-facturable ce mois" value={formatEuro(totalBillableThisMonth())} icon={<Euro />} tone="success" />
        <StatCard label="Pré-factures à préparer" value={aPreparer} icon={<ClipboardList />} tone="neutral" />
        <StatCard label="À vérifier" value={aVerifier} icon={<FileText />} tone="warning" />
        <StatCard label="Prêtes" value={pretes} icon={<CheckCircle2 />} tone="info" />
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Pré-factures</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {preInvoices.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<FileText />} title="Aucune pré-facture" description="Les pré-factures de vos clients apparaîtront ici." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead className="text-right">Sous-total</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preInvoices.map((p) => {
                  const client = getClient(p.client_id);
                  const status = PRE_INVOICE_STATUS[p.status];
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{client?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(p.period_start)} → {formatDate(p.period_end)}
                      </TableCell>
                      <TableCell className="text-right text-sm">{formatEuro(p.subtotal)}</TableCell>
                      <TableCell className="text-right font-medium">{formatEuro(p.total)}</TableCell>
                      <TableCell>
                        <StatusBadge label={status.label} tone={status.tone} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setActive(p)}>
                            Voir le détail
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FileDown className="size-4" /> Exporter en PDF
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        La pré-facture est un récapitulatif de ce qui peut être facturé. Ce n&apos;est pas une facture légale : elle vous
        aide à préparer votre facturation, sans la remplacer.
      </p>

      {/* Paramètres de facturation par client */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de facturation par client</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <div key={c.id} className="rounded-lg border p-4">
              <p className="font-medium">{c.name}</p>
              <Separator className="my-3" />
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Tarif horaire</dt>
                  <dd className="font-medium">65 €/h</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Forfait mensuel</dt>
                  <dd className="font-medium">—</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Temps ce mois</dt>
                  <dd className="font-medium">{formatDuration(clientMinutesThisMonth(c.id))}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Estimation</dt>
                  <dd className="font-medium text-emerald-600">{formatEuro(clientBillableAmount(c.id))}</dd>
                </div>
              </dl>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Détail */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>Détail de la pré-facture</DialogTitle>
                <DialogDescription>
                  {getClient(active.client_id)?.name} · {formatDate(active.period_start)} → {formatDate(active.period_end)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <Row label="Forfait mensuel" value={formatEuro(0)} />
                <Row label="Temps facturable" value={formatEuro(active.subtotal)} />
                <Row label="Prestations ponctuelles" value={formatEuro(active.total - active.subtotal)} />
                <Separator />
                <div className="flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatEuro(active.total)}</span>
                </div>
                {active.notes && (
                  <div className="rounded-lg bg-muted p-3 text-muted-foreground">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide">Notes</p>
                    {active.notes}
                  </div>
                )}
              </div>
              <Button variant="outline">
                <FileDown className="size-4" /> Exporter en PDF
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
