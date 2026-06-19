"use client";

import { useEffect, useState, useTransition } from "react";
import { Clock, Euro, ListChecks, Ban, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatDuration, formatEuro } from "@/lib/utils";
import type { TimeView } from "@/lib/supabase/time";
import { createTimeEntryAction, deleteTimeEntryAction } from "./actions";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
function localDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function TimeViewClient({
  view,
  clientOptions,
  caseOptions,
  isDemo,
}: {
  view: TimeView;
  clientOptions: { id: string; name: string }[];
  caseOptions: { id: string; title: string }[];
  isDemo: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [todayStr, setTodayStr] = useState(localDateInputValue());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTodayStr(localDateInputValue());
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Temps passé" description="Combien de temps ai-je travaillé ?">
        {isDemo && <Badge variant="warning">Mode démo</Badge>}
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Temps total ce mois" value={formatDuration(view.totalMinutes)} icon={<Clock />} tone="info" />
        <StatCard label="Facturable estimé" value={formatEuro(view.totalBillable)} icon={<Euro />} tone="success" />
        <StatCard label="Entrées" value={view.entryCount} icon={<ListChecks />} tone="purple" />
        <StatCard label="Heures non facturables" value={formatDuration(view.nonBillableMinutes)} icon={<Ban />} tone="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="size-5 text-primary" /> Saisir du temps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              action={createTimeEntryAction}
              onSubmit={(event) => {
                const data = new FormData(event.currentTarget);
                const duration = Number(data.get("duration_minutes"));
                const rate = Number(data.get("hourly_rate"));
                if (!data.get("client_id")) {
                  event.preventDefault();
                  setError("Le client est obligatoire.");
                } else if (!data.get("date")) {
                  event.preventDefault();
                  setError("La date est obligatoire.");
                } else if (!Number.isFinite(duration) || duration <= 0) {
                  event.preventDefault();
                  setError("La durée doit être strictement supérieure à zéro.");
                } else if (data.get("hourly_rate") && (!Number.isFinite(rate) || rate < 0)) {
                  event.preventDefault();
                  setError("Le tarif horaire doit être un nombre positif ou nul.");
                } else {
                  setError(null);
                }
              }}
            >
              {error && (
                <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="client_id">Client</Label>
                <select id="client_id" name="client_id" defaultValue="" required className={selectClass}>
                  <option value="" disabled>
                    Sélectionner un client
                  </option>
                  {clientOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hr_case_id">Dossier (optionnel)</Label>
                <select id="hr_case_id" name="hr_case_id" defaultValue="" className={selectClass}>
                  <option value="">—</option>
                  {caseOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" name="date" type="date" value={todayStr} onChange={(event) => setTodayStr(event.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="duration_minutes">Durée (min)</Label>
                  <Input id="duration_minutes" name="duration_minutes" type="number" min={1} step={5} placeholder="90" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Qu'avez-vous fait ?" />
              </div>

              <div className="grid grid-cols-2 items-end gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="hourly_rate">Tarif horaire (€)</Label>
                  <Input id="hourly_rate" name="hourly_rate" type="number" min={0} placeholder="65" defaultValue="65" />
                </div>
                <label className="flex h-9 cursor-pointer items-center gap-2 text-sm font-medium">
                  <input type="checkbox" name="billable" defaultChecked className="size-4 rounded border-input accent-primary" />
                  Facturable
                </label>
              </div>

              <Button type="submit" className="w-full">
                <Plus className="size-4" /> Ajouter
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader>
            <CardTitle>Liste du temps passé</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {view.entries.length === 0 ? (
              <div className="p-6">
                <EmptyState icon={<Clock />} title="Aucun temps saisi" description="Ajoutez votre première entrée de temps." />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Dossier</TableHead>
                    <TableHead className="text-right">Durée</TableHead>
                    <TableHead>Facturable</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view.entries.map((t) => (
                    <TableRow key={t.id} data-pending={pending ? "" : undefined}>
                      <TableCell className="text-sm">{formatDate(t.date)}</TableCell>
                      <TableCell className="text-sm font-medium">{t.client_name ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.case_title ?? "—"}</TableCell>
                      <TableCell className="text-right font-medium">{formatDuration(t.duration_minutes)}</TableCell>
                      <TableCell>
                        {t.billable ? <Badge variant="success">Oui</Badge> : <Badge variant="neutral">Non</Badge>}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{t.description ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        {!isDemo && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Supprimer"
                            onClick={() => {
                              if (window.confirm("Supprimer cette entrée de temps ?")) {
                                startTransition(() => {
                                  void deleteTimeEntryAction(t.id);
                                });
                              }
                            }}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Résumé mensuel par client</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {view.perClient.map((c) => (
            <div key={c.id} className="rounded-lg border p-4">
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.sector}</p>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Temps ce mois</p>
                  <p className="text-lg font-semibold">{formatDuration(c.minutes)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Estimation</p>
                  <p className="text-lg font-semibold text-emerald-600">{formatEuro(c.billable)}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
