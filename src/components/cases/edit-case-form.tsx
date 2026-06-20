import Link from "next/link";
import { updateCaseAction } from "@/app/(app)/dossiers/[id]/modifier/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CASE_STATUS, CASE_TYPE, PRIORITY } from "@/lib/constants";
import type { HrCase } from "@/lib/types";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function EditCaseForm({ hrCase }: { hrCase: HrCase }) {
  return (
    <form action={updateCaseAction.bind(null, hrCase.id)} className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Dossier</CardTitle>
            <CardDescription>Mettez à jour le suivi de cette action RH.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre du dossier</Label>
              <Input id="title" name="title" defaultValue={hrCase.title} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="person_name">Personne concernée</Label>
                <Input id="person_name" name="person_name" defaultValue={hrCase.person_name ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="case_type">Type de dossier</Label>
                <select id="case_type" name="case_type" defaultValue={hrCase.case_type} className={selectClass}>
                  {Object.entries(CASE_TYPE).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={4} defaultValue={hrCase.description ?? ""} />
            </div>
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
              <Label htmlFor="status">Statut</Label>
              <select id="status" name="status" defaultValue={hrCase.status} className={selectClass}>
                {Object.entries(CASE_STATUS).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priorité</Label>
              <select id="priority" name="priority" defaultValue={hrCase.priority} className={selectClass}>
                {Object.entries(PRIORITY).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Date limite</Label>
              <Input id="due_date" name="due_date" type="date" defaultValue={hrCase.due_date ?? ""} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes internes</CardTitle>
            <CardDescription>Jamais visible côté client.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea name="internal_notes" rows={5} defaultValue={hrCase.internal_notes ?? ""} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <Button type="submit">Enregistrer les modifications</Button>
          <Button asChild type="button" variant="outline">
            <Link href={`/dossiers/${hrCase.id}`}>Annuler</Link>
          </Button>
        </div>
      </div>
    </form>
  );
}
