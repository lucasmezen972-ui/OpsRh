"use client";

import { useMemo, useState, useTransition } from "react";
import { BarChart3, Download } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdvancedModuleOptions, ReportingReport } from "@/lib/advanced-modules";
import { generateReportingReportAction } from "../actions";

const selectClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm";
const inputClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm";

function localMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const format = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  return { start: format(start), end: format(end) };
}

export function ReportingView({ options }: { options: AdvancedModuleOptions }) {
  const [pending, startTransition] = useTransition();
  const [report, setReport] = useState<ReportingReport | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const range = useMemo(() => localMonthRange(), []);

  function action(formData: FormData) {
    startTransition(async () => {
      const result = await generateReportingReportAction(formData);
      if (result.ok) {
        setReport(result.data);
        setMessage(result.message ?? "Rapport généré.");
      } else {
        setMessage(result.message);
      }
    });
  }

  function downloadReport() {
    if (!report) return;
    const blob = new Blob([report.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${report.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reporting" description="Synthèses mensuelles client, indicateurs RH et points de vigilance.">
        {options.isDemo && <Badge variant="warning">Mode démo</Badge>}
      </PageHeader>

      {message && <p role="status" className="rounded-md border bg-muted px-3 py-2 text-sm">{message}</p>}

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-5" />
              Paramètres du rapport
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={action} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client</Label>
                <select id="client_id" name="client_id" className={selectClass} defaultValue={options.clients[0]?.id ?? ""}>
                  <option value="">Tous clients</option>
                  {options.clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="period_start">Début</Label>
                  <input id="period_start" name="period_start" type="date" defaultValue={range.start} className={inputClass} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period_end">Fin</Label>
                  <input id="period_end" name="period_end" type="date" defaultValue={range.end} className={inputClass} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Note interne à inclure</Label>
                <Textarea id="notes" name="notes" rows={5} placeholder="Ex. Mettre en avant le suivi documentaire et la pré-facturation." />
              </div>
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Génération..." : "Générer le rapport"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Rapport généré</CardTitle>
            <Button variant="outline" size="sm" disabled={!report} onClick={downloadReport}>
              <Download className="size-4" />
              Télécharger
            </Button>
          </CardHeader>
          <CardContent>
            {report ? (
              <div className="space-y-4">
                <div className="rounded-md border bg-muted/50 p-3">
                  <p className="text-sm font-medium">{report.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{report.periodLabel}</p>
                  <p className="mt-2 text-sm">{report.summary}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Metric label="Dossiers actifs" value={`${report.metrics.casesOpen}/${report.metrics.casesTotal}`} />
                  <Metric label="Tâches terminées" value={`${report.metrics.tasksDone}/${report.metrics.tasksTotal}`} />
                  <Metric label="Temps facturable" value={`${Math.round((report.metrics.billableMinutes / 60) * 10) / 10}h`} />
                  <Metric label="Documents à suivre" value={report.metrics.documentsMissing} />
                  <Metric label="Tâches en retard" value={report.metrics.tasksLate} />
                  <Metric label="Montant estimé" value={`${Math.round(report.metrics.billableAmount)} EUR`} />
                </div>
                <Textarea aria-label="Contenu du rapport" value={report.content} readOnly rows={16} />
              </div>
            ) : (
              <div className="flex min-h-[360px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                Générez un rapport pour afficher la synthèse.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
