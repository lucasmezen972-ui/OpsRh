import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  FileText,
  Plus,
  Globe,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  clientActiveCasesCount,
  clientBillableAmount,
  clientMinutesThisMonth,
  clientMissingDocsCount,
  getClient,
  getClientActivity,
  getClientCases,
  getClientContacts,
  getClientDocuments,
  getClientPreInvoices,
  getClientTasks,
  getClientTimeEntries,
} from "@/lib/data";
import {
  CASE_STATUS,
  CASE_TYPE,
  CLIENT_STATUS,
  DOCUMENT_STATUS,
  DOCUMENT_TYPE,
  PRE_INVOICE_STATUS,
  PRIORITY,
  TASK_STATUS,
} from "@/lib/constants";
import { formatDate, formatDuration, formatEuro, formatRelative } from "@/lib/utils";

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const client = getClient(params.id);
  if (!client) notFound();

  const status = CLIENT_STATUS[client.status];
  const contacts = getClientContacts(client.id);
  const cases = getClientCases(client.id);
  const tasks = getClientTasks(client.id);
  const documents = getClientDocuments(client.id);
  const timeEntries = getClientTimeEntries(client.id);
  const preInvoices = getClientPreInvoices(client.id);
  const activity = getClientActivity(client.id);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
        <Link href="/clients">
          <ArrowLeft className="size-4" /> Retour aux clients
        </Link>
      </Button>

      <PageHeader title={client.name} description={client.sector ?? undefined}>
        <StatusBadge label={status.label} tone={status.tone} />
        <Button asChild variant="outline">
          <Link href="/dossiers/nouveau">
            <Plus className="size-4" /> Nouveau dossier
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Dossiers actifs" value={clientActiveCasesCount(client.id)} icon={<FileText />} tone="info" />
        <StatCard label="Docs manquants" value={clientMissingDocsCount(client.id)} icon={<FileText />} tone="warning" />
        <StatCard label="Temps ce mois" value={formatDuration(clientMinutesThisMonth(client.id))} icon={<Calendar />} tone="info" />
        <StatCard label="Pré-facturable" value={formatEuro(clientBillableAmount(client.id))} icon={<FileText />} tone="success" />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
          <TabsTrigger value="cases">Dossiers RH</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="time">Temps passé</TabsTrigger>
          <TabsTrigger value="billing">Pré-facturation</TabsTrigger>
          <TabsTrigger value="portal">Portail client</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Info icon={<Building2 className="size-4" />} label="Secteur" value={client.sector} />
                <Info icon={<MapPin className="size-4" />} label="Adresse" value={client.address} />
                <Info icon={<FileText className="size-4" />} label="SIRET" value={client.siret} />
                <Info icon={<Calendar className="size-4" />} label="Début de collaboration" value={formatDate(client.collaboration_start_date)} />
                <Info icon={<FileText className="size-4" />} label="Type de collaboration" value={client.collaboration_type} />
                <Info icon={<Mail className="size-4" />} label="Email" value={client.main_contact_email} />
                <Info icon={<Phone className="size-4" />} label="Téléphone" value={client.main_contact_phone} />
                <Info icon={<Building2 className="size-4" />} label="Contact principal" value={client.main_contact_name} />
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notes internes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                    {client.notes ?? "Aucune note interne."}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">Visible uniquement par vous, jamais côté client.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contacts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {contacts.map((c) => (
                    <div key={c.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.role}</p>
                      </div>
                      {c.portal_access && <Badge variant="success">Portail</Badge>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Dossiers RH */}
        <TabsContent value="cases">
          {cases.length === 0 ? (
            <EmptyState icon={<FileText />} title="Aucun dossier RH" actionLabel="Créer un dossier" actionHref="/dossiers/nouveau" />
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dossier</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Échéance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link href={`/dossiers/${c.id}`} className="font-medium hover:underline">
                          {c.title}
                        </Link>
                        {c.person_name && <p className="text-xs text-muted-foreground">{c.person_name}</p>}
                      </TableCell>
                      <TableCell className="text-sm">{CASE_TYPE[c.case_type]}</TableCell>
                      <TableCell><StatusBadge label={CASE_STATUS[c.status].label} tone={CASE_STATUS[c.status].tone} /></TableCell>
                      <TableCell><StatusBadge label={PRIORITY[c.priority].label} tone={PRIORITY[c.priority].tone} /></TableCell>
                      <TableCell className="text-sm">{formatDate(c.due_date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents">
          {documents.length === 0 ? (
            <EmptyState icon={<FileText />} title="Aucun document" description="Les documents liés à ce client apparaîtront ici." />
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Ajouté</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell className="text-sm">{DOCUMENT_TYPE[d.document_type]}</TableCell>
                      <TableCell><StatusBadge label={DOCUMENT_STATUS[d.status].label} tone={DOCUMENT_STATUS[d.status].tone} /></TableCell>
                      <TableCell className="text-sm">{formatDate(d.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Tâches */}
        <TabsContent value="tasks">
          {tasks.length === 0 ? (
            <EmptyState icon={<FileText />} title="Aucune tâche" actionLabel="Voir les tâches" actionHref="/taches" />
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tâche</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Échéance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.title}</TableCell>
                      <TableCell><StatusBadge label={TASK_STATUS[t.status].label} tone={TASK_STATUS[t.status].tone} /></TableCell>
                      <TableCell><StatusBadge label={PRIORITY[t.priority].label} tone={PRIORITY[t.priority].tone} /></TableCell>
                      <TableCell className="text-sm">{formatDate(t.due_date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Temps passé */}
        <TabsContent value="time">
          {timeEntries.length === 0 ? (
            <EmptyState icon={<Calendar />} title="Aucun temps saisi" actionLabel="Saisir du temps" actionHref="/temps" />
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Durée</TableHead>
                    <TableHead>Facturable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">{formatDate(t.date)}</TableCell>
                      <TableCell className="text-sm">{t.description}</TableCell>
                      <TableCell className="text-right font-medium">{formatDuration(t.duration_minutes)}</TableCell>
                      <TableCell>
                        {t.billable ? <Badge variant="success">Oui</Badge> : <Badge variant="neutral">Non</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Pré-facturation */}
        <TabsContent value="billing">
          {preInvoices.length === 0 ? (
            <EmptyState icon={<FileText />} title="Aucune pré-facture" actionLabel="Voir la pré-facturation" actionHref="/pre-facturation" />
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Période</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preInvoices.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{formatDate(p.period_start)} → {formatDate(p.period_end)}</TableCell>
                      <TableCell><StatusBadge label={PRE_INVOICE_STATUS[p.status].label} tone={PRE_INVOICE_STATUS[p.status].tone} /></TableCell>
                      <TableCell className="text-right font-medium">{formatEuro(p.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Portail client */}
        <TabsContent value="portal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="size-5 text-primary" /> Portail client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Invitez votre client à accéder à un espace sécurisé pour déposer ses documents, suivre l&apos;avancement
                et créer des demandes. Il ne voit jamais vos notes internes.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {contacts.filter((c) => c.portal_access).length > 0 ? (
                  contacts
                    .filter((c) => c.portal_access)
                    .map((c) => (
                      <Badge key={c.id} variant="success">
                        {c.name} · accès actif
                      </Badge>
                    ))
                ) : (
                  <Badge variant="neutral">Aucun accès portail actif</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link href="/portail">Aperçu du portail</Link>
                </Button>
                <Button>Inviter au portail</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historique */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historique d&apos;activité</CardTitle>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Aucune activité enregistrée.</p>
              ) : (
                <ul className="space-y-3">
                  {activity.map((log) => (
                    <li key={log.id} className="flex items-start gap-3 border-l-2 border-muted pl-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">{log.description}</p>
                        <p className="text-xs text-muted-foreground">{formatRelative(log.created_at)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || "—"}</p>
      </div>
    </div>
  );
}
