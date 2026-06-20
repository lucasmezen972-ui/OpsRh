"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdvancedModuleOptions, AiAssistantDraft } from "@/lib/advanced-modules";
import { runAiAssistantAction } from "../actions";

const selectClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm";

export function AssistantView({ options }: { options: AdvancedModuleOptions }) {
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<AiAssistantDraft | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function action(formData: FormData) {
    startTransition(async () => {
      const result = await runAiAssistantAction(formData);
      if (result.ok) {
        setDraft(result.data);
        setMessage(result.message ?? "Proposition générée.");
      } else {
        setMessage(result.message);
      }
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Assistant IA" description="Relances, synthèses et prochaines actions à partir de vos dossiers.">
        {options.isDemo && <Badge variant="warning">Mode démo</Badge>}
      </PageHeader>
      {message && <p role="status" className="rounded-md border bg-muted px-3 py-2 text-sm">{message}</p>}
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="size-5" />Demande</CardTitle></CardHeader>
          <CardContent>
            <form action={action} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="kind">Type d'aide</Label>
                <select id="kind" name="kind" className={selectClass} defaultValue="relance">
                  <option value="relance">Relance client</option>
                  <option value="resume">Synthèse de dossier</option>
                  <option value="prochaines_actions">Prochaines actions</option>
                  <option value="mail_libre">Mail libre</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_id">Client</Label>
                <select id="client_id" name="client_id" className={selectClass} defaultValue="">
                  <option value="">Sans client précis</option>
                  {options.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hr_case_id">Dossier</Label>
                <select id="hr_case_id" name="hr_case_id" className={selectClass} defaultValue="">
                  <option value="">Sans dossier précis</option>
                  {options.cases.map((hrCase) => <option key={hrCase.id} value={hrCase.id}>{hrCase.title}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prompt">Contexte complémentaire</Label>
                <Textarea id="prompt" name="prompt" rows={6} />
              </div>
              <Button type="submit" disabled={pending} className="w-full">{pending ? "Génération..." : "Générer"}</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Résultat</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {draft ? (
              <>
                <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Objet</p><p className="font-medium">{draft.subject}</p></div>
                <Textarea aria-label="Contenu généré" value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} rows={14} />
                <div className="rounded-md border bg-muted/50 p-3">
                  <p className="text-sm font-medium">Actions proposées</p>
                  <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">{draft.nextActions.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              </>
            ) : (
              <div className="flex min-h-[300px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">Lancez une génération.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
