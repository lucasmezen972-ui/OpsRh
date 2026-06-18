import Link from "next/link";
import { createCaseAction } from "@/app/(app)/dossiers/nouveau/actions";
import { getSupabaseClientOptions } from "@/lib/supabase/cases";
import { getClients } from "@/lib/data";
import { CASE_STATUS, CASE_TYPE, PRIORITY } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export async function NewCaseForm() {
  const supabaseClients = await getSupabaseClientOptions();
  const isDemo = supabaseClients === null;
  const clientOptions = isDemo
    ? getClients().map((c) => ({ id: c.id, name: c.name }))
    : supabaseClients;

  return (
    <form action={createCaseAction} className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Dossier</CardTitle>
            <CardDescription>Décrivez l&apos;action RH à suivre.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre du dossier</Label>
              <Input id="title" name="title" placeholder="Ex. Embauche — Clara Martin" required />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client associé</Label>
                <select id="client_id" name="client_id" required defaultValue="" className={selectClass}>
                  <option value="" disabled>
                    {clientOptions.length ? "Sélectionner un client" : "Aucun client disponible"}
                  </option>
                  {clientOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="person_name">Personne concernée (optionnel)</Label>
                <Input id="person_name" name="person_name" placeholder="Ex. Clara Martin" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="case_type">Type de dossier</Label>
                <select id="case_type" name="case_type" defaultValue="embauche" className={selectClass}>
                  {Object.entries(CASE_TYPE).map(([value, label]) => (
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
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Contexte et objectif du dossier…" rows={4} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents attendus</CardTitle>
            <CardDescription>Un nom de pièce par ligne — une checklist sera créée automatiquement.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              name="expected_documents"
              rows={5}
              placeholder={"Pièce d'identité\nRIB\nJustificatif de domicile\nContrat signé"}
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suivi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Statut initial</Label>
              <select id="status" name="status" defaultValue="nouveau" className={selectClass}>
                {Object.entries(CASE_STATUS).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Date limite</Label>
              <Input id="due_date" name="due_date" type="date" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes internes</CardTitle>
            <CardDescription>Visibles uniquement par vous, jamais côté client.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea name="internal_notes" placeholder="Remarques privées sur ce dossier…" rows={5} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <Button type="submit">Créer le dossier</Button>
          <Button asChild type="button" variant="outline">
            <Link href="/dossiers">Annuler</Link>
          </Button>
        </div>
      </div>
    </form>
  );
}
