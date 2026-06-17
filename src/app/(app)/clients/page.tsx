import Link from "next/link";
import { Users, Plus, Mail, Phone, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  clientActiveCasesCount,
  clientBillableAmount,
  clientMinutesThisMonth,
  clientMissingDocsCount,
  getClients,
} from "@/lib/data";
import { CLIENT_STATUS } from "@/lib/constants";
import { formatDuration, formatEuro, formatRelative } from "@/lib/utils";

export default function ClientsPage() {
  const clients = getClients();

  return (
    <div className="space-y-6">
      <PageHeader title="Clients" description="Quels clients je gère ?">
        <Button asChild>
          <Link href="/clients/nouveau">
            <Plus className="size-4" /> Nouveau client
          </Link>
        </Button>
      </PageHeader>

      {clients.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="Vous n'avez pas encore de client"
          description="Créez votre premier client pour commencer à piloter vos dossiers RH."
          actionLabel="Créer mon premier client"
          actionHref="/clients/nouveau"
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entreprise</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-center">Dossiers actifs</TableHead>
                <TableHead className="text-center">Docs manquants</TableHead>
                <TableHead className="text-right">Temps / mois</TableHead>
                <TableHead className="text-right">Pré-facturable</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => {
                const status = CLIENT_STATUS[client.status];
                const missing = clientMissingDocsCount(client.id);
                return (
                  <TableRow key={client.id} className="cursor-pointer">
                    <TableCell>
                      <Link href={`/clients/${client.id}`} className="block">
                        <p className="font-medium">{client.name}</p>
                        <p className="text-xs text-muted-foreground">{client.sector}</p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{client.main_contact_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {client.main_contact_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="size-3" /> {client.main_contact_email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge label={status.label} tone={status.tone} />
                    </TableCell>
                    <TableCell className="text-center font-medium">{clientActiveCasesCount(client.id)}</TableCell>
                    <TableCell className="text-center">
                      {missing > 0 ? (
                        <Badge variant="warning">{missing}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatDuration(clientMinutesThisMonth(client.id))}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatEuro(clientBillableAmount(client.id))}
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/clients/${client.id}`} aria-label={`Ouvrir ${client.name}`}>
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
