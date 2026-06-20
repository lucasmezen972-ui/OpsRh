"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckSquare, Inbox } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PRIORITY, TASK_TYPE } from "@/lib/constants";
import type { AdvancedModuleOptions, ImportedMessageResult } from "@/lib/advanced-modules";
import { importInboundMessageAction } from "../actions";

const selectClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm";
type ImportResult = ImportedMessageResult & { createdTaskId: string | null };

export function ImportView({ options }: { options: AdvancedModuleOptions }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ImportResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function action(formData: FormData) {
    startTransition(async () => {
      const res = await importInboundMessageAction(formData);
      if (res.ok) {
        setResult(res.data);
        setMessage(res.message ?? "Message importé.");
      } else setMessage(res.message);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Import WhatsApp / Email" description="Transformez un message collé en tâche contextualisée.">
        {options.isDemo && <Badge variant="warning">Mode démo</Badge>}
      </PageHeader>
      {message && <p role="status" className="rounded-md border bg-muted px-3 py-2 text-sm">{message}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Inbox className="size-5" />Message</CardTitle></CardHeader>
          <CardContent>
            <form action={action} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="source">Source</Label><select id="source" name="source" className={selectClass}><option value="email">Email</option><option value="whatsapp">WhatsApp</option></select></div>
              <div className="space-y-2"><Label htmlFor="client_id">Client</Label><select id="client_id" name="client_id" className={selectClass}><option value="">À déterminer</option>{options.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></div>
              <div className="space-y-2"><Label htmlFor="raw_content">Contenu du message</Label><Textarea id="raw_content" name="raw_content" rows={10} required /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="create_task" defaultChecked />Créer une tâche</label>
              <Button type="submit" disabled={pending}>Importer</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Résultat</CardTitle><Button asChild size="sm" variant="outline"><Link href={result?.createdTaskId ? `/taches?taskId=${result.createdTaskId}` : "/taches"}><CheckSquare className="size-4" />Voir les tâches</Link></Button></CardHeader>
          <CardContent>{result ? <div className="space-y-3 text-sm"><p>Titre proposé : <strong>{result.title}</strong></p><p>Type : {TASK_TYPE[result.taskType]}</p><p>Priorité : {PRIORITY[result.priority].label}</p><p className="rounded-md border bg-muted/50 p-3 whitespace-pre-wrap">{result.summary}</p></div> : <div className="flex min-h-[260px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">Importez un message.</div>}</CardContent>
        </Card>
      </div>
    </div>
  );
}
