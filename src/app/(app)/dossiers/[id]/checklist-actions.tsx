"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DocumentStatus } from "@/lib/types";
import { setChecklistItemStatusAction } from "@/app/(app)/documents/actions";

export function ChecklistActions({
  itemId,
  clientId,
  caseId,
  documentName,
  isDemo,
}: {
  itemId: string;
  clientId: string;
  caseId: string;
  documentName: string;
  isDemo: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function update(status: DocumentStatus) {
    startTransition(async () => {
      const result = await setChecklistItemStatusAction(itemId, status);
      setMessage(result.ok ? "Statut mis à jour." : result.message);
    });
  }

  if (isDemo) {
    return (
      <div className="flex shrink-0 flex-wrap gap-2" title="Connectez-vous pour modifier une checklist.">
        <Button asChild variant="outline" size="sm">
          <Link href={`/mails?clientId=${clientId}&caseId=${caseId}&type=relance_documents&document=${encodeURIComponent(documentName)}`}>
            Relancer
          </Link>
        </Button>
        <Button variant="outline" size="sm" disabled>
          Marquer reçu
        </Button>
        <Button size="sm" disabled>
          <CheckCircle2 className="size-4" /> Valider
        </Button>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/mails?clientId=${clientId}&caseId=${caseId}&type=relance_documents&document=${encodeURIComponent(documentName)}`}>
          Relancer
        </Link>
      </Button>
      <Button variant="outline" size="sm" disabled={pending} onClick={() => update("recu")}>
        Marquer reçu
      </Button>
      <Button size="sm" disabled={pending} onClick={() => update("valide")}>
        <CheckCircle2 className="size-4" /> Valider
      </Button>
      {message && <span role="status" className="text-xs text-muted-foreground">{message}</span>}
    </div>
  );
}
