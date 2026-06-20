"use client";

import { useState, useTransition } from "react";
import { ScanLine } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DOCUMENT_STATUS, DOCUMENT_TYPE } from "@/lib/constants";
import type { AdvancedModuleOptions, DocumentAnalysisResult } from "@/lib/advanced-modules";
import { analyzeDocumentAction } from "../actions";

const selectClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm";

export function AnalyseView({ options, initialDocumentId = "" }: { options: AdvancedModuleOptions; initialDocumentId?: string }) {
  const [pending, startTransition] = useTransition();
  const [documentId, setDocumentId] = useState(initialDocumentId);
  const [result, setResult] = useState<DocumentAnalysisResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const selected = options.documents.find((doc) => doc.id === documentId);

  function action(formData: FormData) {
    if (selected) {
      formData.set("filename", selected.name);
      formData.set("mime_type", selected.file_type ?? "");
    }
    startTransition(async () => {
      const res = await analyzeDocumentAction(formData);
      if (res.ok) {
        setResult(res.data);
        setMessage(res.message ?? "Analyse réalisée.");
      } else setMessage(res.message);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Analyse automatique des documents" description="Détection du type, points à vérifier et statut conseillé.">
        {options.isDemo && <Badge variant="warning">Mode démo</Badge>}
      </PageHeader>
      {message && <p role="status" className="rounded-md border bg-muted px-3 py-2 text-sm">{message}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ScanLine className="size-5" />Analyser</CardTitle></CardHeader>
          <CardContent>
            <form action={action} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="document_id">Document existant</Label><select id="document_id" name="document_id" value={documentId} onChange={(e) => setDocumentId(e.target.value)} className={selectClass}><option value="">Nouveau document</option>{options.documents.map((doc) => <option key={doc.id} value={doc.id}>{doc.name}</option>)}</select></div>
              {!selected && <div className="space-y-2"><Label htmlFor="filename">Nom du document</Label><Input id="filename" name="filename" /></div>}
              <div className="space-y-2"><Label htmlFor="content">Texte ou indices visibles</Label><Textarea id="content" name="content" rows={8} /></div>
              <Button type="submit" disabled={pending}>Analyser</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Résultat d'analyse</CardTitle></CardHeader>
          <CardContent>
            {result ? <div className="space-y-3 text-sm"><p>Type détecté : <strong>{DOCUMENT_TYPE[result.detectedType]}</strong></p><p>Confiance : {Math.round(result.confidence * 100)} %</p><p>Statut conseillé : {DOCUMENT_STATUS[result.suggestedStatus].label}</p><p className="rounded-md border bg-muted/50 p-3">{result.summary}</p>{result.issues.length > 0 && <ul className="list-inside list-disc">{result.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}</div> : <div className="flex min-h-[260px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">Lancez une analyse.</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
