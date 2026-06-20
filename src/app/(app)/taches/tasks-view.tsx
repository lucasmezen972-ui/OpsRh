"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  AlertTriangle,
  Send,
  ListTodo,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  CalendarClock,
  FolderOpen,
  Mail,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PRIORITY, TASK_STATUS, TASK_TYPE } from "@/lib/constants";
import { formatDate, isOverdue } from "@/lib/utils";
import type { TaskRow, TaskSuggestion } from "@/lib/supabase/tasks";
import { completeTaskAction, createTaskAction, deleteTaskAction, postponeTaskAction } from "./actions";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface Option {
  id: string;
  name: string;
}
interface CaseOption {
  id: string;
  title: string;
}

function TaskTable({ tasks }: { tasks: TaskRow[] }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function query(task: TaskRow) {
    const params = new URLSearchParams();
    if (task.client_id) params.set("clientId", task.client_id);
    if (task.hr_case_id) params.set("caseId", task.hr_case_id);
    params.set("taskId", task.id);
    return params.toString();
  }

  function run(action: () => Promise<{ ok: true } | { ok: false; message: string }>) {
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? "Action enregistrée." : result.message);
    });
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<ListTodo />}
        title="Aucune tâche ici"
        description="Rien à traiter pour ce filtre. Profitez-en pour avancer sur vos dossiers."
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      {message && <p role="status" className="px-4 pt-3 text-sm text-muted-foreground">{message}</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titre</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Dossier</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Priorité</TableHead>
            <TableHead>Échéance</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const overdue = isOverdue(task.due_date) && task.status !== "termine";
            return (
              <TableRow key={task.id} data-pending={pending ? "" : undefined}>
                <TableCell>
                  <p className="font-medium">{task.title}</p>
                  {task.description && (
                    <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">{task.description}</p>
                  )}
                </TableCell>
                <TableCell className="text-sm">{task.client_name ?? "—"}</TableCell>
                <TableCell className="text-sm">{task.case_title ?? "—"}</TableCell>
                <TableCell className="text-sm">{TASK_TYPE[task.type]}</TableCell>
                <TableCell>
                  <StatusBadge label={PRIORITY[task.priority].label} tone={PRIORITY[task.priority].tone} />
                </TableCell>
                <TableCell className={overdue ? "text-sm font-medium text-destructive" : "text-sm"}>
                  {formatDate(task.due_date)}
                </TableCell>
                <TableCell>
                  <StatusBadge label={TASK_STATUS[task.status].label} tone={TASK_STATUS[task.status].tone} />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Actions">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions rapides</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => run(() => completeTaskAction(task.id))}>
                        <CheckCircle2 className="text-emerald-600" /> Terminer
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => run(() => postponeTaskAction(task.id))}>
                        <CalendarClock className="text-amber-600" /> Reporter (+1 j)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/mails?${query(task)}&type=relance_documents`}>
                          <Mail className="text-violet-600" /> Générer une relance
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/temps?${query(task)}`}>
                          <Clock className="text-blue-600" /> Ajouter du temps
                        </Link>
                      </DropdownMenuItem>
                      {task.hr_case_id && (
                        <DropdownMenuItem asChild>
                          <Link href={`/dossiers/${task.hr_case_id}`}>
                            <FolderOpen className="text-slate-600" /> Ouvrir le dossier
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          if (window.confirm("Supprimer cette tâche ?")) run(() => deleteTaskAction(task.id));
                        }}
                      >
                        <Trash2 /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

export function TasksView({
  all,
  today,
  overdue,
  relances,
  suggestions,
  clientOptions,
  caseOptions,
  isDemo,
}: {
  all: TaskRow[];
  today: TaskRow[];
  overdue: TaskRow[];
  relances: TaskRow[];
  suggestions: TaskSuggestion[];
  clientOptions: Option[];
  caseOptions: CaseOption[];
  isDemo: boolean;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title="Tâches" description="Que dois-je faire ?">

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> Nouvelle tâche
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle tâche</DialogTitle>
              <DialogDescription>
                {isDemo
                  ? "Connectez-vous à Supabase pour enregistrer réellement vos tâches."
                  : "Définissez un titre, un client, un dossier, une priorité et une échéance."}
              </DialogDescription>
            </DialogHeader>
            <form action={createTaskAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input id="title" name="title" placeholder="Ex. Relancer pour le RIB" required />
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <select id="type" name="type" defaultValue="relance_client" className={selectClass}>
                    {Object.entries(TASK_TYPE).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priorité</Label>
                  <select id="priority" name="priority" defaultValue="normale" className={selectClass}>
                    {Object.entries(PRIORITY).map(([value, meta]) => (
                      <option key={value} value={value}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Échéance</Label>
                <Input id="due_date" name="due_date" type="date" />
              </div>
              <Button type="submit" className="w-full">
                Créer la tâche
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="À faire aujourd'hui" value={today.length} icon={<CalendarCheck />} tone="info" />
        <StatCard label="En retard" value={overdue.length} icon={<AlertTriangle />} tone="danger" />
        <StatCard label="Relances à faire" value={relances.length} icon={<Send />} tone="purple" />
        <StatCard label="Total ouvertes" value={all.length} icon={<ListTodo />} tone="neutral" />
      </div>

      <Tabs defaultValue="all">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="today">Aujourd&apos;hui</TabsTrigger>
          <TabsTrigger value="overdue">En retard</TabsTrigger>
          <TabsTrigger value="relances">Relances</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <TaskTable tasks={all} />
        </TabsContent>
        <TabsContent value="today">
          <TaskTable tasks={today} />
        </TabsContent>
        <TabsContent value="overdue">
          <TaskTable tasks={overdue} />
        </TabsContent>
        <TabsContent value="relances">
          <TaskTable tasks={relances} />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="size-5 text-violet-600" /> Relances automatiques proposées
          </CardTitle>
        </CardHeader>
        <CardContent>
          {suggestions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucune relance à proposer pour le moment. 🎉
            </p>
          ) : (
            <ul className="space-y-3">
              {suggestions.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-col gap-3 rounded-lg border border-violet-100 bg-violet-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm">
                      Le document <span className="font-medium">{s.name}</span> est toujours manquant
                      {s.case_title ? (
                        <>
                          {" "}
                          pour le dossier <span className="font-medium">{s.case_title}</span>
                        </>
                      ) : null}
                      . Voulez-vous générer une relance&nbsp;?
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Demandé depuis {s.days} jours</p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="shrink-0">
                    <Link href={`/mails?caseId=${s.case_id ?? ""}&type=relance_documents&document=${encodeURIComponent(s.name)}`}>
                      <Mail className="size-4" /> Générer une relance
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
