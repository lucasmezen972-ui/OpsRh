import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Flag,
  History,
  Mail,
  MessageSquare,
  Send,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  caseReceivedDocsCount,
  caseMissingDocsCount,
  getCase,
  getCaseActivity,
  getCaseChecklists,
  getCaseComments,
  getCaseEmails,
  getCaseTasks,
  getCaseTimeEntries,
  getChecklistItems,
  getClient,
} from "@/lib/data";
import { getSupabaseCaseDetail, type CaseDetail } from "@/lib/supabase/details";
import { CASE_STATUS, CASE_TYPE, DOCUMENT_STATUS, PRIORITY } from "@/lib/constants";
import { formatDate, formatDuration, formatRelative } from "@/lib/utils";

export default async function DossierDetailPage({ params }: { params: { id: string } }) {
  const result = await getSupabaseCaseDetail(params.id);
  if (result.status === "not_found") notFound();

  let detail: CaseDetail;
  let isDemo: boolean;

  if (result.status === "ok") {
    detail = result.detail;
    isDemo = false;
  } else {
    const hrCase = getCase(params.id);
    if (!hrCase) notFound();
    isDemo = true;
    const docs = caseReceivedDocsCount(hrCase.id);
    const timeEntries = getCaseTimeEntries(hrCase.id);
    detail = {
      hrCase,
      client: getClient(hrCase.client_id),
      checklists: getCaseChecklists(hrCase.id).map((checklist) => ({
        checklist,
        items: getChecklistItems(checklist.id),
      })),
      tasks: getCaseTasks(hrCase.id),
      documents: [],
      timeEntries,
      emails: getCaseEmails(hrCase.id),
      comments: getCaseComments(hrCase.id),
      activity: getCaseActivity(hrCase.id),
      stats: {
        received: docs.received,
        total: docs.total,
        missing: caseMissingDocsCount(hrCase.id),
        minutes: timeEntries.reduce((sum, t) => sum + t.duration_minutes, 0),
      },
    };
  }

  const { hrCase, client, checklists, tasks, emails, comments, timeEntries, activity, stats } = detail;
  const status = CASE_STATUS[hrCase.status];
  const priority = PRIORITY[hrCase.priority];

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
        <Link href="/dossiers">
          <ArrowLeft className="size-4" /> Retour aux dossiers
        </Link>
      </Button>

      <PageHeader title={hrCase.title} description={client?.name ?? undefined}>
        {isDemo && <Badge variant="warning">Mode démo</Badge>}
        <StatusBadge label={status.label} tone={status.tone} />
        <StatusBadge label={priority.label} tone={priority.tone} />
        <Button asChild variant="outline">
          <Link href="/mails">
            <Send className="size-4" /> Générer une relance
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Statut" value={status.label} icon={<Flag />} tone={status.tone} />
        <StatCard label="Priorité" value={priority.label} icon={<Flag />} tone={priority.tone} />
        <StatCard label="Échéance" value={formatDate(hrCase.due_date)} icon={<Calendar />} tone="info" />
        <StatCard label="Documents reçus" value={`${stats.received}/${stats.total}`} icon={<FileText />} tone="success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="space-y-4 lg:col-span-2">
          {/* Résumé */}
          <Card>
            <CardHeader>
              <CardTitle>Résumé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {hrCase.description || "Aucune description pour ce dossier."}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Type de dossier</p>
                  <p className="text-sm font-medium">{CASE_TYPE[hrCase.case_type]}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Personne concernée</p>
                  <p className="text-sm font-medium">{hrCase.person_name || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checklist documents */}
          <Card>
            <CardHeader>
              <CardTitle>Checklist documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {checklists.length === 0 ? (
                <EmptyState
                  icon={<FileText />}
                  title="Aucune checklist"
                  description="Ajoutez une checklist pour suivre les documents attendus."
                />
              ) : (
                checklists.map(({ checklist, items }) => (
                  <div key={checklist.id} className="space-y-3">
                    <p className="text-sm font-semibold">{checklist.title}</p>
                    <ul className="space-y-3">
                      {items.map((item) => {
                        const docStatus = DOCUMENT_STATUS[item.status];
                        return (
                          <li
                            key={item.id}
                            className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between"
                          >
                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium">{item.name}</p>
                                {item.required ? (
                                  <Badge variant="warning">Obligatoire</Badge>
                                ) : (
                                  <Badge variant="neutral">Optionnel</Badge>
                                )}
                                <StatusBadge label={docStatus.label} tone={docStatus.tone} />
                              </div>
                              {item.comment && <p className="text-xs text-muted-foreground">{item.comment}</p>}
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-2">
                              <Button variant="outline" size="sm">
                                Relancer
                              </Button>
                              <Button variant="outline" size="sm">
                                Marquer reçu
                              </Button>
                              <Button size="sm">
                                <CheckCircle2 className="size-4" /> Valider
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Tâches liées */}
          <Card>
            <CardHeader>
              <CardTitle>Tâches liées</CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Aucune tâche liée à ce dossier.</p>
              ) : (
                <ul className="space-y-3">
                  {tasks.map((t) => (
                    <li
                      key={t.id}
                      className="flex flex-col gap-2 border-b pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <p className="text-sm font-medium">{t.title}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge label={PRIORITY[t.priority].label} tone={PRIORITY[t.priority].tone} />
                        <span className="text-xs text-muted-foreground">{formatDate(t.due_date)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Mails générés */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="size-5 text-primary" /> Mails générés
              </CardTitle>
            </CardHeader>
            <CardContent>
              {emails.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Aucun mail généré pour ce dossier.</p>
              ) : (
                <ul className="space-y-3">
                  {emails.map((e) => (
                    <li
                      key={e.id}
                      className="flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{e.subject}</p>
                        <p className="text-xs text-muted-foreground">{formatRelative(e.created_at)}</p>
                      </div>
                      <Badge variant="neutral">{e.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Commentaires */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="size-5 text-primary" /> Commentaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              {comments.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Aucun commentaire.</p>
              ) : (
                <ul className="space-y-3">
                  {comments.map((c) => (
                    <li key={c.id} className="rounded-lg border p-3">
                      <div className="mb-1 flex items-center gap-2">
                        {c.visibility === "internal" ? (
                          <Badge variant="warning">Interne</Badge>
                        ) : (
                          <Badge variant="info">Visible client</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">{formatRelative(c.created_at)}</span>
                      </div>
                      <p className="text-sm">{c.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-4">
          {/* Notes internes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes internes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                {hrCase.internal_notes ?? "Aucune note interne."}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Jamais visible côté client.</p>
            </CardContent>
          </Card>

          {/* Temps passé */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-5 text-primary" /> Temps passé
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-2xl font-semibold tracking-tight">{formatDuration(stats.minutes)}</p>
              {timeEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun temps saisi.</p>
              ) : (
                <ul className="space-y-2">
                  {timeEntries.map((t) => (
                    <li key={t.id} className="flex items-start justify-between gap-2 text-sm">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                        <p className="truncate">{t.description}</p>
                      </div>
                      <span className="shrink-0 font-medium">{formatDuration(t.duration_minutes)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Historique */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="size-5 text-primary" /> Historique
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune activité enregistrée.</p>
              ) : (
                <ul className="space-y-3">
                  {activity.map((log) => (
                    <li key={log.id} className="border-l-2 border-muted pl-4">
                      <p className="text-sm">{log.description}</p>
                      <p className="text-xs text-muted-foreground">{formatRelative(log.created_at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
