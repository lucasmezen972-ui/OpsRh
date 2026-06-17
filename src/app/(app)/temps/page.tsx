"use client";

import { useState } from "react";
import { Clock, Euro, ListChecks, Ban, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  clientBillableAmount,
  clientMinutesThisMonth,
  getCase,
  getCases,
  getClient,
  getClients,
  getTimeEntries,
  totalBillableThisMonth,
  totalMinutesThisMonth,
} from "@/lib/data";
import type { TimeEntry } from "@/lib/types";
import { formatDate, formatDuration, formatEuro } from "@/lib/utils";

const today = new Date().toISOString().slice(0, 10);

export default function TempsPage() {
  const clients = getClients();
  const cases = getCases();
  const [extra, setExtra] = useState<TimeEntry[]>([]);

  const [clientId, setClientId] = useState("");
  const [caseId, setCaseId] = useState("");
  const [date, setDate] = useState(today);
  const [minutes, setMinutes] = useState("");
  const [description, setDescription] = useState("");
  const [billable, setBillable] = useState(true);
  const [rate, setRate] = useState("65");

  const entries = [...extra, ...getTimeEntries()].sort((a, b) => b.date.localeCompare(a.date));
  const nonBillableMinutes = getTimeEntries()
    .filter((t) => !t.billable)
    .reduce((sum, t) => sum + t.duration_minutes, 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const duration = parseInt(minutes, 10);
    if (!clientId || !duration) return;
    const entry: TimeEntry = {
      id: `local-${Date.now()}`,
      owner_id: "local",
      client_id: clientId,
      hr_case_id: caseId || null,
      task_id: null,
      date,
      duration_minutes: duration,
      description: description || null,
      billable,
      hourly_rate: rate ? parseFloat(rate) : null,
      created_at: new Date().toISOString(),
    };
    setExtra((prev) => [entry, ...prev]);
    setMinutes("");
    setDescription("");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Temps passé" description="Combien de temps ai-je travaillé ?" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Temps total ce mois" value={formatDuration(totalMinutesThisMonth())} icon={<Clock />} tone="info" />
        <StatCard label="Facturable estimé" value={formatEuro(totalBillableThisMonth())} icon={<Euro />} tone="success" />
        <StatCard label="Entrées" value={getTimeEntries().length} icon={<ListChecks />} tone="purple" />
        <StatCard label="Heures non facturables" value={formatDuration(nonBillableMinutes)} icon={<Ban />} tone="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Saisie */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="size-5 text-primary" /> Saisir du temps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="client">Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="case">Dossier</Label>
                <Select value={caseId} onValueChange={setCaseId}>
                  <SelectTrigger id="case">
                    <SelectValue placeholder="Sélectionner un dossier (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {cases
                      .filter((c) => !clientId || c.client_id === clientId)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="minutes">Durée (min)</Label>
                  <Input
                    id="minutes"
                    type="number"
                    min={0}
                    step={5}
                    placeholder="90"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Que avez-vous fait ?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 items-end gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="rate">Tarif horaire (€)</Label>
                  <Input
                    id="rate"
                    type="number"
                    min={0}
                    placeholder="65"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                  />
                </div>
                <label className="flex h-9 cursor-pointer items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-input accent-primary"
                    checked={billable}
                    onChange={(e) => setBillable(e.target.checked)}
                  />
                  Facturable
                </label>
              </div>

              <Button type="submit" className="w-full">
                <Plus className="size-4" /> Ajouter
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Liste */}
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader>
            <CardTitle>Liste du temps passé</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {entries.length === 0 ? (
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((t) => {
                    const client = t.client_id ? getClient(t.client_id) : null;
                    const hrCase = t.hr_case_id ? getCase(t.hr_case_id) : null;
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="text-sm">{formatDate(t.date)}</TableCell>
                        <TableCell className="text-sm font-medium">{client?.name ?? "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{hrCase?.title ?? "—"}</TableCell>
                        <TableCell className="text-right font-medium">{formatDuration(t.duration_minutes)}</TableCell>
                        <TableCell>
                          {t.billable ? <Badge variant="success">Oui</Badge> : <Badge variant="neutral">Non</Badge>}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{t.description ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Résumé mensuel par client */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé mensuel par client</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <div key={c.id} className="rounded-lg border p-4">
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.sector}</p>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Temps ce mois</p>
                  <p className="text-lg font-semibold">{formatDuration(clientMinutesThisMonth(c.id))}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Estimation</p>
                  <p className="text-lg font-semibold text-emerald-600">{formatEuro(clientBillableAmount(c.id))}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
