import Link from "next/link";
import {
  CalendarCheck,
  AlertTriangle,
  FileWarning,
  Ban,
  Send,
  Clock,
  Euro,
  ArrowUpRight,
  Activity,
  FileText,
  CheckCircle2,
  Mail,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { dashboardStats, getActivity, getCase, getClient, todayTasks, urgentAlerts } from "@/lib/data";
import { getSupabaseDashboard, type DashboardData } from "@/lib/supabase/dashboard";
import { PRIORITY, TASK_TYPE } from "@/lib/constants";
import type { Priority, TaskType } from "@/lib/types";
import { formatDuration, formatEuro, formatRelative, isOverdue } from "@/lib/utils";

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  document_ajoute: <FileText className="size-4 text-blue-600" />,
  tache_terminee: <CheckCircle2 className="size-4 text-emerald-600" />,
  mail_genere: <Mail className="size-4 text-violet-600" />,
  temps_ajoute: <Clock className="size-4 text-amber-600" />,
  commentaire_ajoute: <MessageSquare className="size-4 text-blue-600" />,
  dossier_maj: <Activity className="size-4 text-slate-600" />,
};

export default async function DashboardPage() {
  const supabaseData = await getSupabaseDashboard();
  const isDemo = supabaseData === null;

  const data: DashboardData = supabaseData ?? {
    stats: dashboardStats(),
    today: todayTasks().map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      type: t.type,
      client_name: t.client_id ? getClient(t.client_id)?.name ?? null : null,
      case_title: t.hr_case_id ? getCase(t.hr_case_id)?.title ?? null : null,
      due_date: t.due_date,
      status: t.status,
    })),
    alerts: urgentAlerts().map((a) => ({ id: a.id, title: a.title, detail: a.detail, href: a.href })),
    activity: getActivity()
      .slice(0, 6)
      .map((log) => ({
        id: log.id,
        action_type: log.action_type,
        description: log.description,
        client_name: log.client_id ? getClient(log.client_id)?.name ?? null : null,
        created_at: log.created_at,
      })),
  };

  const { stats, today, alerts, activity } = data;
  const now = new Date();
  const dateLabel = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(now);

  return (
    <div className="space-y-6">
      <PageHeader
        title="À traiter aujourd'hui"
        description={`${dateLabel.charAt(0).toUpperCase()}${dateLabel.slice(1)} — voici ce qui demande votre attention.`}
      >
        {isDemo && <Badge variant="warning">Mode démo</Badge>}
        <Button asChild variant="outline">
          <Link href="/temps">Saisir du temps</Link>
        </Button>
        <Button asChild>
          <Link href="/dossiers/nouveau">Nouveau dossier</Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard label="Tâches du jour" value={stats.todayTasks} icon={<CalendarCheck />} tone="info" href="/taches" />
        <StatCard label="En retard" value={stats.overdueTasks} icon={<AlertTriangle />} tone="danger" href="/taches" />
        <StatCard label="Docs manquants" value={stats.missingDocs} icon={<FileWarning />} tone="warning" href="/documents" />
        <StatCard label="Dossiers bloqués" value={stats.blockedCases} icon={<Ban />} tone="danger" href="/dossiers" />
        <StatCard label="Relances à faire" value={stats.relances} icon={<Send />} tone="purple" href="/taches" />
        <StatCard label="Temps ce mois" value={formatDuration(stats.minutesThisMonth)} icon={<Clock />} tone="info" href="/temps" />
        <StatCard label="Pré-facturable" value={formatEuro(stats.billableThisMonth)} icon={<Euro />} tone="success" href="/pre-facturation" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bloc Aujourd'hui */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="size-5 text-primary" /> Aujourd&apos;hui
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/taches">
                Tout voir <ChevronRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {today.length === 0 ? (
              <EmptyState
                icon={<CalendarCheck />}
                title="Rien d'urgent pour aujourd'hui"
                description="Profitez-en pour avancer sur vos dossiers en cours."
              />
            ) : (
              <ul className="divide-y">
                {today.map((task) => {
                  const overdue = isOverdue(task.due_date) && task.status !== "termine";
                  return (
                    <li key={task.id} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">{task.title}</p>
                          <StatusBadge
                            label={PRIORITY[task.priority as Priority].label}
                            tone={PRIORITY[task.priority as Priority].tone}
                          />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {TASK_TYPE[task.type as TaskType]}
                          {task.client_name && ` · ${task.client_name}`}
                          {task.case_title && ` · ${task.case_title}`}
                          {overdue && <span className="font-medium text-destructive"> · en retard</span>}
                        </p>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href="/taches">Traiter</Link>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Bloc Urgent */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" /> Urgent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Aucune alerte. 🎉</p>
            ) : (
              <ul className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <li key={alert.id}>
                    <Link
                      href={alert.href}
                      className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50/50 p-3 transition-colors hover:bg-red-50"
                    >
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{alert.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{alert.detail}</p>
                      </div>
                      <ArrowUpRight className="ml-auto size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bloc Activité récente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-5 text-primary" /> Activité récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucune activité récente.</p>
          ) : (
            <ul className="space-y-1">
              {activity.map((log) => (
                <li key={log.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    {ACTIVITY_ICONS[log.action_type] ?? <Activity className="size-4 text-slate-600" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{log.description}</p>
                    {log.client_name && <p className="text-xs text-muted-foreground">{log.client_name}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(log.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
