import Link from "next/link";
import { createClientAction } from "@/app/(app)/clients/nouveau/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function NewClientForm() {
  return (
    <form action={createClientAction} className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Entreprise</CardTitle>
            <CardDescription>Informations générales sur le client.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'entreprise</Label>
                <Input id="name" name="name" placeholder="Ex. Atelier Martin" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sector">Secteur</Label>
                <Input id="sector" name="sector" placeholder="Ex. Bâtiment, Restauration…" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" name="address" placeholder="Ex. 12 rue de la République, 75011 Paris" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siret">SIRET (optionnel)</Label>
              <Input id="siret" name="siret" placeholder="Ex. 123 456 789 00012" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact principal</CardTitle>
            <CardDescription>L'interlocuteur que vous solliciterez en priorité.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="main_contact_name">Nom du contact</Label>
              <Input id="main_contact_name" name="main_contact_name" placeholder="Ex. Sophie Martin" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="main_contact_email">Email</Label>
                <Input id="main_contact_email" name="main_contact_email" type="email" placeholder="contact@exemple.fr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="main_contact_phone">Téléphone</Label>
                <Input id="main_contact_phone" name="main_contact_phone" type="tel" placeholder="06 12 34 56 78" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Collaboration</CardTitle>
            <CardDescription>Comment se structure votre accompagnement.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue="actif"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="actif">Actif</option>
                  <option value="en_pause">En pause</option>
                  <option value="termine">Terminé</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="collaboration_type">Type de collaboration</Label>
                <Input id="collaboration_type" name="collaboration_type" placeholder="Ex. Forfait mensuel, à la mission…" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="collaboration_start_date">Date de début</Label>
              <Input id="collaboration_start_date" name="collaboration_start_date" type="date" />
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
            <Textarea name="notes" placeholder="Remarques privées sur ce client…" rows={6} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <Button type="submit">Créer le client</Button>
          <Button asChild type="button" variant="outline">
            <Link href="/clients">Annuler</Link>
          </Button>
        </div>
      </div>
    </form>
  );
}
