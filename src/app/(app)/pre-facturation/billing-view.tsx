"use client";

import { useState, useTransition } from "react";
import { Euro, FileText, CheckCircle2, ClipboardList, FileDown, Info } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PRE_INVOICE_STATUS } from "@/lib/constants";
import type { PreInvoiceStatus } from "@/lib/types";
import { formatDate, formatDuration, formatEuro } from "@/lib/utils";
import type { PreInvoiceBoard, PreInvoiceRow } from "@/lib/supabase/billing";
import { updatePreInvoiceStatusAction } from "./actions";

const NEXT_STATUSES: PreInvoiceStatus[] = ["a_preparer", "a_verifier", "prete", "exportee", "archivee"];

export function BillingView({ board, isDemo }: { board: PreInvoiceBoard; isDemo: boolean }) {
  const [active, setActive] = useState<PreInvoiceRow | null>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const aPreparer = board.rows.filter((p) => p.status === "a_preparer").length;
  const aVerifier = board.rows.filter((p) => p.status === "a_verifier").length;
  const pretes = board.rows.filter((p) => p.status === "prete").length;

  function downloadPreInvoicePdf(row: PreInvoiceRow) {
    const fileName = `pre-facturation-${row.client_name ?? "client"}-${row.period_start}-${row.period_end}.pdf`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .toLowerCase();
    const lines = [
      "Ops RH",
      "Document de pre-facturation",
      "",
      `Client : ${row.client_name ?? "-"}`,
      `Periode : ${formatDate(row.period_start)} -> ${formatDate(row.period_end)}`,
      `Temps facturable : ${formatEuro(row.subtotal)}`,
      `Prestations : ${formatEuro(row.total - row.subtotal)}`,
      `Sous-total : ${formatEuro(row.subtotal)}`,
      `Total : ${formatEuro(row.total)}`,
      "",
      "Notes :",
      row.notes ?? "-",
      "",
      "Mention : ce document est un recapitulatif de pre-facturation et ne constitue pas une facture legale.",
    ];
    const pdf = buildSimplePdf(lines);
    const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage("PDF de pré-facturation téléchargé.");

    if (!isDemo) {
      startTransition(async () => {
        const result = await updatePreInvoiceStatusAction(row.id, "exportee");
        if (!result.ok) setMessage(result.message);
        else setActive((current) => (current?.id === row.id ? { ...current, status: "exportee" } : current));
      });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Pré-facturation" description="Que dois-je facturer ?">
        {isDemo && <Badge variant="warning">Mode démo</Badge>}
      </PageHeader>
      {message && (
        <p role="status" className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
          {message}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total pré-facturable ce mois" value={formatEuro(board.totalBillable)} icon={<Euro />} tone="success" />
        <StatCard label="Pré-factures à préparer" value={aPreparer} icon={<ClipboardList />} tone="neutral" />
        <StatCard label="À vérifier" value={aVerifier} icon={<FileText />} tone="warning" />
        <StatCard label="Prêtes" value={pretes} icon={<CheckCircle2 />} tone="info" />
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Pré-factures</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {board.rows.length === 0 ? (
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
                {board.rows.map((p) => {
                  const status = PRE_INVOICE_STATUS[p.status];
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.client_name ?? "—"}</TableCell>
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
                          <Button variant="ghost" size="sm" disabled={pending} onClick={() => downloadPreInvoicePdf(p)}>
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

      <Card>
        <CardHeader>
          <CardTitle>Paramètres de facturation par client</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {board.perClient.map((c) => (
            <div key={c.id} className="rounded-lg border p-4">
              <p className="font-medium">{c.name}</p>
              <Separator className="my-3" />
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Tarif horaire</dt>
                  <dd className="font-medium">{c.hourly_rate != null ? `${c.hourly_rate} €/h` : "—"}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Forfait mensuel</dt>
                  <dd className="font-medium">{c.monthly_retainer != null ? formatEuro(c.monthly_retainer) : "—"}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Temps ce mois</dt>
                  <dd className="font-medium">{formatDuration(c.minutes)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Estimation</dt>
                  <dd className="font-medium text-emerald-600">{formatEuro(c.billable)}</dd>
                </div>
              </dl>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>Détail de la pré-facture</DialogTitle>
                <DialogDescription>
                  {active.client_name} · {formatDate(active.period_start)} → {formatDate(active.period_end)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
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

              {!isDemo && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Changer le statut</p>
                  <div className="flex flex-wrap gap-2">
                    {NEXT_STATUSES.map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={s === active.status ? "default" : "outline"}
                        disabled={pending || s === active.status}
                        onClick={() =>
                          startTransition(async () => {
                            const result = await updatePreInvoiceStatusAction(active.id, s);
                            setMessage(result.ok ? "Statut mis à jour." : result.message);
                            if (result.ok) setActive({ ...active, status: s });
                          })
                        }
                      >
                        {PRE_INVOICE_STATUS[s].label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <Button variant="outline" disabled={pending} onClick={() => downloadPreInvoicePdf(active)}>
                <FileDown className="size-4" /> Exporter en PDF
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function buildSimplePdf(lines: string[]) {
  const escape = (value: string) => value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const content = [
    "BT",
    "/F1 18 Tf",
    "50 790 Td",
    ...lines.flatMap((line, index) => {
      const size = index === 0 ? "/F1 18 Tf" : index === 1 ? "/F1 14 Tf" : "/F1 11 Tf";
      return [size, `(${escape(line)}) Tj`, "0 -18 Td"];
    }),
    "ET",
  ].join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
