"use client";

import { useState, useTransition } from "react";
import { Download, PenTool } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSignatureRequestAction, signSignatureRequestAction } from "../actions";

type RequestState = { id: string; title: string; status: string; signedAt?: string };

export function SignatureView({ isDemo }: { isDemo: boolean }) {
  const [pending, startTransition] = useTransition();
  const [request, setRequest] = useState<RequestState | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function create(formData: FormData) {
    startTransition(async () => {
      const result = await createSignatureRequestAction(formData);
      if (result.ok) {
        setRequest(result.data);
        setMessage(result.message ?? "Demande créée.");
      } else {
        setMessage(result.message);
      }
    });
  }

  function sign(formData: FormData) {
    if (!request) return;
    formData.set("request_id", request.id);
    startTransition(async () => {
      const result = await signSignatureRequestAction(formData);
      if (result.ok) {
        setRequest({ ...request, status: result.data.status, signedAt: result.data.signedAt });
        setMessage(result.message ?? "Signature enregistrée.");
      } else {
        setMessage(result.message);
      }
    });
  }

  function downloadProof() {
    if (!request) return;
    const blob = new Blob([`${request.title}\nStatut: ${request.status}\nSigné le: ${request.signedAt ?? ""}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${request.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-preuve.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Signature électronique" description="Demande de signature, consentement horodaté et preuve téléchargeable.">
        {isDemo && <Badge variant="warning">Mode démo</Badge>}
      </PageHeader>
      {message && <p role="status" className="rounded-md border bg-muted px-3 py-2 text-sm">{message}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><PenTool className="size-5" />Préparer</CardTitle></CardHeader>
          <CardContent>
            <form action={create} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="title">Titre</Label><Input id="title" name="title" required /></div>
              <div className="space-y-2"><Label htmlFor="signer_name">Signataire</Label><Input id="signer_name" name="signer_name" required /></div>
              <div className="space-y-2"><Label htmlFor="signer_email">Email</Label><Input id="signer_email" name="signer_email" type="email" /></div>
              <div className="space-y-2"><Label htmlFor="document_body">Document</Label><Textarea id="document_body" name="document_body" rows={8} required defaultValue="Document à signer" /></div>
              <Button type="submit" disabled={pending}>Créer la demande</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Signer</CardTitle>
            <Button variant="outline" size="sm" disabled={!request || request.status !== "signe"} onClick={downloadProof}><Download className="size-4" />Preuve</Button>
          </CardHeader>
          <CardContent>
            {request ? (
              <form action={sign} className="space-y-4">
                <input type="hidden" name="request_id" value={request.id} />
                <p className="rounded-md border bg-muted/50 p-3 text-sm">{request.title} · {request.status}</p>
                <div className="space-y-2"><Label htmlFor="signer_name_confirm">Nom complet</Label><Input id="signer_name_confirm" name="signer_name" required disabled={request.status === "signe"} /></div>
                <div className="space-y-2"><Label htmlFor="signature_value">Signature</Label><Input id="signature_value" name="signature_value" required disabled={request.status === "signe"} /></div>
                <Button type="submit" disabled={pending || request.status === "signe"}>Signer électroniquement</Button>
              </form>
            ) : <div className="flex min-h-[260px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">Créez une demande.</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
