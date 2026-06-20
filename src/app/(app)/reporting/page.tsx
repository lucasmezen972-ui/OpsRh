import Link from "next/link";
import { BarChart3, FileDown } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  clientActiveCasesCount,
  clientBillableAmount,
  clientMinutesThisMonth,
  getClientCases,
  getClientDocuments,
  getClientTasks,
  getClientTimeEntries,
  getClientRequests,
  getClients,
} from "@/lib/data";
import { getReportOverview, currentMonthPeriod, type ClientReport } from "@/lib/supabase/reporting";
import { formatDuration, formatEuro } from "@/lib/utils";

function thisMonth(dateStr: string) {
  const d = new Date(dateStr);
  const n = new Date();
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

export default async function ReportingPage() {
  const overview = await getReportOverview();
  const isDemo = overview === null;
  const period = currentMonthPeriod();

  const reports: ClientReport[] = overview ?? getClients().map((c) => {
    const billableMinutes = getClientTimeEntries(c.id)
      .filter((t) => t.billable && thisMonth(t.date))
      .reduce((s, t) => s + t.duration_minutes, 0);
    return {
      clientId: c.id,
      clientName: c.name,
      minutes: clientMinutesThisMonth(c.id),
      billableMinutes,
      billableAmount: clientBillableAmount(c.id),
      tasksCompleted: getClientTasks(c.id).filter((t) => t.status === "termine").length,
      activeCases: clientActiveCasesCount(c.id),
      closedCases: getClientCases(c.id).filter((k) => k.status === "termine" || k.status === "archive").length,
      docsReceived: getClientDocuments(c.id).filter((d) => d.status === "recu" || d.status === "valide").length,
      requests: getClientRequests().filter((r) => r.client_id === c.id).length,
    };
  });

  const label = period.label.charAt(0).toUpperCase() + period.label.slice(1);

  return (
    <div className="space-y-6">
      <PageHeader title="Reporting" description={`Synthèse mensuelle de votre activité — ${label}.`}>

      </PageHeader>

      {reports.length === 0 ? (
        <EmptyState
          icon={<BarChart3 />}
          title="Aucune donnée à rapporter"
          description="Ajoutez des clients et saisissez votre activité pour générer des rapports."
          actionLabel="Créer un client"
          actionHref="/clients/nouveau"
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Temps</TableHead>
                <TableHead className="text-right">Facturable</TableHead>
                <TableHead className="text-center">Tâches faites</TableHead>
                <TableHead className="text-center">Dossiers actifs</TableHead>
                <TableHead className="text-center">Docs reçus</TableHead>
                <TableHead className="text-center">Demandes</TableHead>
                <TableHead className="text-right">Rapport</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.clientId}>
                  <TableCell className="font-medium">{r.clientName}</TableCell>
                  <TableCell className="text-right text-sm">{formatDuration(r.minutes)}</TableCell>
                  <TableCell className="text-right text-sm font-medium text-emerald-600">{formatEuro(r.billableAmount)}</TableCell>
                  <TableCell className="text-center">{r.tasksCompleted}</TableCell>
                  <TableCell className="text-center">{r.activeCases}</TableCell>
                  <TableCell className="text-center">{r.docsReceived}</TableCell>
                  <TableCell className="text-center">{r.requests}</TableCell>
                  <TableCell className="text-right">
                    {isDemo ? (
                      <Button variant="ghost" size="sm" disabled title="Connectez-vous pour exporter le rapport.">
                        <FileDown className="size-4" /> PDF
                      </Button>
                    ) : (
                      <Button asChild variant="ghost" size="sm">
                        <a href={`/reporting/${r.clientId}/pdf`} target="_blank" rel="noopener noreferrer">
                          <FileDown className="size-4" /> PDF
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <p className="text-sm text-muted-foreground">
        Les rapports synthétisent l&apos;activité du mois en cours par client : temps passé, montant pré-facturable,
        tâches réalisées, dossiers et documents traités, et demandes reçues.
      </p>
    </div>
  );
}
