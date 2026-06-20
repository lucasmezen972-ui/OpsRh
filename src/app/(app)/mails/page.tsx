"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Mail,
  Plus,
  Sparkles,
  Copy,
  Send,
  FileText,
  Check,
  LayoutTemplate,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCases, getClients, getEmailTemplates, getGeneratedEmails } from "@/lib/data";
import { formatRelative } from "@/lib/utils";
import type { Tone } from "@/lib/constants";
import { createEmailTemplateAction, markGeneratedEmailSentAction, saveGeneratedEmailAction } from "./actions";

const MAIL_TYPES: { value: string; label: string }[] = [
  { value: "relance_documents", label: "Relance documents manquants" },
  { value: "confirmation_reception", label: "Confirmation réception dossier" },
  { value: "demande_information", label: "Demande d'information" },
  { value: "suivi_dossier", label: "Suivi de dossier" },
  { value: "rappel_echeance", label: "Rappel d'échéance" },
  { value: "transmission_document", label: "Transmission de document" },
  { value: "compte_rendu", label: "Compte rendu court" },
  { value: "demande_validation", label: "Demande de validation" },
  { value: "relance_prefacturation", label: "Relance pré-facturation" },
];

const DOCUMENT_MODELS = [
  "Fiche de poste",
  "Checklist onboarding",
  "Compte rendu d'entretien",
  "Compte rendu de point client",
  "Demande de documents",
  "Synthèse dossier",
  "Courrier RH simple",
  "Rapport mensuel simple",
];

const SIGNATURE = "\n\nBien cordialement,\nLucas Mezen";

function generateEmail(type: string, clientName: string, caseName: string): { subject: string; body: string } {
  const dossier = caseName || "votre dossier";
  const client = clientName || "Madame, Monsieur";
  switch (type) {
    case "relance_documents":
      return {
        subject: `Documents manquants — ${dossier}`,
        body:
          `Bonjour ${client},\n\nDans le cadre du dossier « ${dossier} », il nous manque encore les pièces suivantes :\n\n- Pièce d'identité\n- RIB\n- Justificatif de domicile\n\nPourriez-vous nous les transmettre dès que possible afin de poursuivre le traitement ?` +
          SIGNATURE,
      };
    case "confirmation_reception":
      return {
        subject: `Bonne réception — ${dossier}`,
        body:
          `Bonjour ${client},\n\nJe vous confirme la bonne réception des éléments pour le dossier « ${dossier} ». Je reviens vers vous sous peu pour la suite.` +
          SIGNATURE,
      };
    case "demande_information":
      return {
        subject: `Demande d'information — ${dossier}`,
        body:
          `Bonjour ${client},\n\nAfin d'avancer sur le dossier « ${dossier} », auriez-vous quelques précisions à m'apporter sur les points suivants ?\n\nJe reste à votre disposition pour en échanger.` +
          SIGNATURE,
      };
    case "suivi_dossier":
      return {
        subject: `Point d'avancement — ${dossier}`,
        body:
          `Bonjour ${client},\n\nJe reviens vers vous pour faire le point sur le dossier « ${dossier} ». L'avancement se poursuit comme prévu et je vous tiendrai informé(e) des prochaines étapes.` +
          SIGNATURE,
      };
    case "rappel_echeance":
      return {
        subject: `Rappel d'échéance — ${dossier}`,
        body:
          `Bonjour ${client},\n\nPetit rappel concernant l'échéance à venir pour le dossier « ${dossier} ». N'hésitez pas à revenir vers moi si besoin.` +
          SIGNATURE,
      };
    case "transmission_document":
      return {
        subject: `Transmission de document — ${dossier}`,
        body:
          `Bonjour ${client},\n\nVous trouverez ci-joint le document relatif au dossier « ${dossier} ». Je reste disponible pour toute question.` +
          SIGNATURE,
      };
    case "compte_rendu":
      return {
        subject: `Compte rendu — ${dossier}`,
        body:
          `Bonjour ${client},\n\nÀ la suite de notre échange concernant le dossier « ${dossier} », voici un bref compte rendu des points abordés et des prochaines actions.` +
          SIGNATURE,
      };
    case "demande_validation":
      return {
        subject: `Demande de validation — ${dossier}`,
        body:
          `Bonjour ${client},\n\nLe dossier « ${dossier} » est prêt. Pourriez-vous me confirmer votre validation afin que je puisse finaliser le traitement ?` +
          SIGNATURE,
      };
    case "relance_prefacturation":
      return {
        subject: `Pré-facturation — ${dossier}`,
        body:
          `Bonjour ${client},\n\nJe me permets de revenir vers vous concernant la pré-facturation liée au dossier « ${dossier} ». Pourriez-vous m'indiquer si tout est en ordre de votre côté ?` +
          SIGNATURE,
      };
    default:
      return {
        subject: `À propos de ${dossier}`,
        body: `Bonjour ${client},\n\n` + SIGNATURE,
      };
  }
}

const STATUS_TONES: Record<string, Tone> = {
  brouillon: "warning",
  envoye: "success",
  programme: "info",
};

export default function MailsPage() {
  const [pending, startTransition] = useTransition();
  const clients = getClients();
  const cases = getCases();
  const templates = getEmailTemplates();
  const [templateList, setTemplateList] = useState(templates);
  const [generated, setGenerated] = useState(getGeneratedEmails());
  const [message, setMessage] = useState<string | null>(null);
  const [lastGeneratedId, setLastGeneratedId] = useState<string | null>(null);

  const [documentName, setDocumentName] = useState<string | null>(null);

  const [type, setType] = useState<string>(MAIL_TYPES[0].value);
  const [clientId, setClientId] = useState<string>(clients[0]?.id ?? "");
  const [caseId, setCaseId] = useState<string>(cases[0]?.id ?? "");

  const initial = useMemo(() => {
    const clientName = clients[0]?.name ?? "";
    const caseName = cases[0]?.title ?? "";
    return generateEmail(MAIL_TYPES[0].value, clientName, caseName);
  }, [cases, clients]);

  const [subject, setSubject] = useState<string>(initial.subject);
  const [body, setBody] = useState<string>(initial.body);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextType = params.get("type") ?? MAIL_TYPES[0].value;
    const nextClientId = params.get("clientId") ?? clients[0]?.id ?? "";
    const nextCaseId = params.get("caseId") ?? cases[0]?.id ?? "";
    const nextDocumentName = params.get("document");
    setType(nextType);
    setClientId(nextClientId);
    setCaseId(nextCaseId);
    setDocumentName(nextDocumentName);

    const clientName = clients.find((c) => c.id === nextClientId)?.name ?? "";
    const caseName = cases.find((c) => c.id === nextCaseId)?.title ?? "";
    const email = generateEmail(nextType, clientName, caseName);
    setSubject(email.subject);
    setBody(
      nextDocumentName
        ? email.body.replace("- Pièce d'identité\n- RIB\n- Justificatif de domicile", `- ${nextDocumentName}`)
        : email.body
    );
  }, [cases, clients]);

  function handleGenerate() {
    const clientName = clients.find((c) => c.id === clientId)?.name ?? "";
    const caseName = cases.find((c) => c.id === caseId)?.title ?? "";
    const { subject: s, body: b } = generateEmail(type, clientName, caseName);
    const nextBody = documentName
      ? b.replace("- Pièce d'identité\n- RIB\n- Justificatif de domicile", `- ${documentName}`)
      : b;
    setSubject(s);
    setBody(nextBody);
    setCopied(false);
    setMessage("Mail généré. Vous pouvez le modifier avant enregistrement.");
    startTransition(async () => {
      const result = await saveGeneratedEmailAction({
        client_id: clientId,
        hr_case_id: caseId,
        subject: s,
        body: nextBody,
        status: "brouillon",
      });
      if (result.ok) {
        const id = result.id ?? `local-${Date.now()}`;
        setLastGeneratedId(id);
        setGenerated((current) => [
          { id, owner_id: "", client_id: clientId, hr_case_id: caseId, template_id: null, subject: s, body: nextBody, status: "brouillon", created_at: new Date().toISOString() },
          ...current,
        ]);
        setMessage("Mail généré et enregistré en brouillon.");
      } else if (result.reason === "configuration") {
        const id = `demo-${Date.now()}`;
        setLastGeneratedId(id);
        setGenerated((current) => [
          { id, owner_id: "", client_id: clientId, hr_case_id: caseId, template_id: null, subject: s, body: nextBody, status: "brouillon", created_at: new Date().toISOString() },
          ...current,
        ]);
        setMessage("Mail généré en brouillon local (configuration production).");
      } else {
        setMessage(result.message);
      }
    });
  }

  function loadTemplate(tplType: string, tplSubject: string, tplBody: string) {
    setType(tplType);
    setSubject(tplSubject);
    setBody(tplBody);
    setCopied(false);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`);
      setCopied(true);
      setMessage("Mail copié dans le presse-papiers.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setMessage("Impossible de copier le mail.");
    }
  }

  function markAsSent() {
    if (!lastGeneratedId) {
      setMessage("Générez d'abord un brouillon avant de le marquer comme envoyé.");
      return;
    }
    if (lastGeneratedId.startsWith("demo-") || lastGeneratedId.startsWith("local-")) {
      setGenerated((current) => current.map((mail) => (mail.id === lastGeneratedId ? { ...mail, status: "envoye" } : mail)));
      setMessage("Mail marqué comme envoyé en configuration production.");
      return;
    }
    startTransition(async () => {
      const result = await markGeneratedEmailSentAction(lastGeneratedId);
      setMessage(result.ok ? "Mail marqué comme envoyé." : result.message);
      if (result.ok) {
        setGenerated((current) => current.map((mail) => (mail.id === lastGeneratedId ? { ...mail, status: "envoye" } : mail)));
      }
    });
  }

  function createTemplate(formData: FormData) {
    const title = String(formData.get("template_title") ?? "");
    const tplType = String(formData.get("template_type") ?? "");
    const tplSubject = String(formData.get("template_subject") ?? "");
    const tplBody = String(formData.get("template_body") ?? "");
    const variables = String(formData.get("template_variables") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    setMessage("Création du modèle en cours...");
    startTransition(async () => {
      const result = await createEmailTemplateAction({ title, type: tplType, subject: tplSubject, body: tplBody, variables });
      if (result.ok || result.reason === "configuration") {
        setTemplateList((current) => [
          { id: result.ok ? result.id ?? `tpl-${Date.now()}` : `demo-tpl-${Date.now()}`, owner_id: "", title, type: tplType, subject: tplSubject, body: tplBody, variables, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          ...current,
        ]);
        setMessage(result.ok ? "Modèle créé." : "Modèle créé localement en configuration production.");
      } else {
        setMessage(result.message);
      }
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Mails & modèles" description="Que puis-je générer ?">
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> Nouveau modèle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau modèle de mail</DialogTitle>
              <DialogDescription>Créez un modèle réutilisable avec vos variables métier.</DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                createTemplate(new FormData(event.currentTarget));
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="template_title">Titre</Label>
                <Input id="template_title" name="template_title" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="template_type">Type</Label>
                <Input id="template_type" name="template_type" defaultValue={type} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="template_subject">Objet</Label>
                <Input id="template_subject" name="template_subject" defaultValue={subject} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="template_body">Corps</Label>
                <Textarea id="template_body" name="template_body" defaultValue={body} rows={8} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="template_variables">Variables disponibles</Label>
                <Input id="template_variables" name="template_variables" defaultValue="{{contact}}, {{dossier}}, {{signature}}" />
              </div>
              <Button type="submit" disabled={pending} className="w-full">Créer le modèle</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>
      {message && (
        <p role="status" className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
          {message}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Générer un mail */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-violet-600" /> Générer un mail
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Type de mail</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type de mail" />
                  </SelectTrigger>
                  <SelectContent>
                    {MAIL_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Dossier</Label>
                <Select value={caseId} onValueChange={setCaseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Dossier" />
                  </SelectTrigger>
                  <SelectContent>
                    {cases.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleGenerate} disabled={pending}>
              <Sparkles className="size-4" /> Générer
            </Button>

            <div className="space-y-1.5">
              <Label htmlFor="mail-subject">Objet</Label>
              <Input id="mail-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mail-body">Corps du mail</Label>
              <Textarea
                id="mail-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[260px] font-mono text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleCopy}>
                {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                {copied ? "Copié" : "Copier"}
              </Button>
              <Button variant="outline" disabled={pending} onClick={markAsSent}>
                <Send className="size-4" /> Marquer comme envoyé
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Modèles de mails */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="size-5 text-primary" /> Modèles de mails
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {templates.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Aucun modèle enregistré.</p>
            ) : (
              templateList.map((tpl) => (
                <div key={tpl.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{tpl.title}</p>
                      <Badge variant="purple" className="mt-1">{tpl.type}</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => loadTemplate(tpl.type, tpl.subject, tpl.body)}
                    >
                      Utiliser
                    </Button>
                  </div>
                  <p className="mt-2 truncate text-xs text-muted-foreground">{tpl.subject}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modèles de documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutTemplate className="size-5 text-primary" /> Modèles de documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DOCUMENT_MODELS.map((name) => (
              <div key={name} className="flex flex-col justify-between rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{name}</p>
                </div>
                <Button size="sm" variant="outline" className="mt-3 w-full" disabled title="Bientôt disponible : génération PDF de modèles de documents non développée dans cet audit.">
                  Générer en PDF · Bientôt disponible
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mails générés récemment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="size-5 text-primary" /> Mails générés récemment
          </CardTitle>
        </CardHeader>
        <CardContent>
          {generated.length === 0 ? (
            <EmptyState
              icon={<Mail />}
              title="Aucun mail généré"
              description="Les mails que vous générez apparaîtront ici."
            />
          ) : (
            <ul className="divide-y">
              {generated.map((mail) => (
                <li key={mail.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{mail.subject}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatRelative(mail.created_at)}</p>
                  </div>
                  <StatusBadge label={mail.status} tone={STATUS_TONES[mail.status] ?? "neutral"} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
