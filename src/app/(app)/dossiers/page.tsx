import Link from "next/link";
import { FileText, Plus, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  caseMissingDocsCount,
  caseReceivedDocsCount,
  getCases,
  getCaseTasks,
  getClient,
} from "@/lib/data";
import { getSupabaseCaseList } from "@/lib/supabase/cases";
import { CASE_STATUS, CASE_TYPE, PRIORITY } from "@/lib/constants";
import type { CaseStatus, CaseType, Priority } from "@/lib/types";
import { cn, formatDate, isOverdue } from "@/lib/utils";

const FILTERS = [
  "En cours",
  "Bloqué",
  "En attente client",
  "Terminé",
  "Urgent",
  "Avec documents manquants",
  "Échéance proche",
];

interface CaseRow {
  id: string;
  title: string;
  person_name: string | null;
  client_name: string | null;
  case_type: CaseType;
  status: CaseStatus;
  priority: Priority;
  due_date: string | null;
  received: number;
  total: number;
  missing: number;
  openTasks: number;
}

export default async function DossiersPage() {
  const supabaseCases = await getSupabaseCaseList();
  const isDemo = supabaseCases === null;

  const rows: CaseRow[] = isDemo
    ? getCases().map((c) => {
        const docs = caseReceivedDocsCount(c.id);
        return {
          id: c.id,
          title: c.title,
          person_name: c.person_name,
          client_name: getClient(c.client_id)?.name ?? null,
          case_type: c.case_type,
          status: c.status,
          priority: c.priority,
          due_date: c.due_date,
          received: docs.received,
          total: docs.total,
          missing: caseMissingDocsCount(c.id),
          openTasks: getCaseTasks(c.id).filter((t) => t.status !== "termine").length,
        };
      })
    : supabaseCases.map((c) => ({
        id: c.id,
        title: c.title,
        person_name: c.person_name,
        client_name: c.client_name,
        case_type: c.case_type,
        status: c.status,
        priority: c.priority,
        due_date: c.due_date,
        received: c.received_docs,
        total: c.total_docs,
        missing: c.missing_docs,
        openTasks: c.open_tasks,
      }));

  return (
    <div className="space-y-6">
      <PageHeader title="Dossiers RH" description="Où en sont mes dossiers ?">
        {isDemo && <Badge variant="warning">Mode démo</Badge>}
        <Button asChild>
          <Link href="/dossiers/nouveau">
            <Plus className="size-4" /> Nouveau dossier
          </Link>
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Button key={filter} variant="outline" size="sm" className="rounded-full">
            {filter}
          </Button>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="Aucun dossier RH"
          description="Créez votre premier dossier pour suivre embauches, contrats et documents."
          actionLabel="Créer un dossier"
          actionHref="/dossiers/nouveau"
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dossier</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead className="text-center">Documents</TableHead>
                <TableHead className="text-center">Tâches ouvertes</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => {
                const overdue = isOverdue(c.due_date) && c.status !== "termine";
                return (
                  <TableRow key={c.id} className="cursor-pointer">
                    <TableCell>
                      <Link href={`/dossiers/${c.id}`} className="block">
                        <p className="font-medium">{c.title}</p>
                        {c.person_name && <p className="text-xs text-muted-foreground">{c.person_name}</p>}
                        {c.client_name && <p className="text-xs text-muted-foreground">{c.client_name}</p>}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{CASE_TYPE[c.case_type]}</TableCell>
                    <TableCell>
                      <StatusBadge label={CASE_STATUS[c.status].label} tone={CASE_STATUS[c.status].tone} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge label={PRIORITY[c.priority].label} tone={PRIORITY[c.priority].tone} />
                    </TableCell>
                    <TableCell className="text-center">
                      {c.total === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-sm">
                            {c.received}/{c.total} reçus
                          </span>
                          {c.missing > 0 && <Badge variant="warning">{c.missing}</Badge>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-medium">{c.openTasks}</TableCell>
                    <TableCell className={cn("text-sm", overdue && "font-medium text-red-600")}>
                      {formatDate(c.due_date)}
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/dossiers/${c.id}`} aria-label={`Ouvrir ${c.title}`}>
                          <ChevronRight className="size-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
