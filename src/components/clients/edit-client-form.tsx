import Link from "next/link";
import { updateClientAction } from "@/app/(app)/clients/[id]/modifier/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CLIENT_STATUS } from "@/lib/constants";
import type { Client } from "@/lib/types";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function EditClientForm({ client }: { client: Client }) {
  return (
    <form action={updateClientAction.bind(null, client.id)} className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Entreprise</CardTitle>
            <CardDescription>Informations générales sur le client.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l&apos;entreprise</Label>
                <Input id="name" name="name" defaultValue={client.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sector">Secteur</Label>
                <Input id="sector" name="sector" defaultValue={client.sector ?? ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" name="address" defaultValue={client.address ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siret">SIRET</Label>
              <Input id="siret" name="siret" defaultValue={client.siret ?? ""} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact principal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="main_contact_name">Nom du contact</Label>
              <Input id="main_contact_name" name="main_contact_name" defaultValue={client.main_contact_name ?? ""} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="main_contact_email">Email</Label>
                <Input id="main_contact_email" name="main_contact_email" type="email" defaultValue={client.main_contact_email ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="main_contact_phone">Téléphone</Label>
                <Input id="main_contact_phone" name="main_contact_phone" type="tel" defaultValue={client.main_contact_phone ?? ""} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Collaboration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <select id="status" name="status" defaultValue={client.status} className={selectClass}>
                  {Object.entries(CLIENT_STATUS).map(([value, meta]) => (
                    <option key={value} value={value}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="collaboration_type">Type de collaboration</Label>
                <Input id="collaboration_type" name="collaboration_type" defaultValue={client.collaboration_type ?? ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="collaboration_start_date">Date de début</Label>
              <Input id="collaboration_start_date" name="collaboration_start_date" type="date" defaultValue={client.collaboration_start_date ?? ""} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes internes</CardTitle>
            <CardDescription>Visibles uniquement par vous, jamais côté client.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea name="notes" rows={6} defaultValue={client.notes ?? ""} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <Button type="submit">Enregistrer les modifications</Button>
          <Button asChild type="button" variant="outline">
            <Link href={`/clients/${client.id}`}>Annuler</Link>
          </Button>
        </div>
      </div>
    </form>
  );
}
