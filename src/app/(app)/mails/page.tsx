"use client";

import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCases, getClients, getEmailTemplates, getGeneratedEmails } from "@/lib/data";
import { formatRelative } from "@/lib/utils";
import type { Tone } from "@/lib/constants";

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
  const clients = getClients();
  const cases = getCases();
  const templates = getEmailTemplates();
  const generated = getGeneratedEmails();

  const [type, setType] = useState<string>(MAIL_TYPES[0].value);
  const [clientId, setClientId] = useState<string>(clients[0]?.id ?? "");
  const [caseId, setCaseId] = useState<string>(cases[0]?.id ?? "");

  const defaultClientName = clients[0]?.name ?? "";
  const defaultCaseName = cases[0]?.title ?? "";
  const initial = generateEmail(MAIL_TYPES[0].value, defaultClientName, defaultCaseName);

  const [subject, setSubject] = useState<string>(initial.subject);
  const [body, setBody] = useState<string>(initial.body);
  const [copied, setCopied] = useState(false);

  function handleGenerate() {
    const clientName = clients.find((c) => c.id === clientId)?.name ?? "";
    const caseName = cases.find((c) => c.id === caseId)?.title ?? "";
    const { subject: s, body: b } = generateEmail(type, clientName, caseName);
    setSubject(s);
    setBody(b);
    setCopied(false);
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
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Mails & modèles" description="Que puis-je générer ?">
        <Button>
          <Plus className="size-4" /> Nouveau modèle
        </Button>
      </PageHeader>

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

            <Button onClick={handleGenerate}>
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
              <Button variant="outline">
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
              templates.map((tpl) => (
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
                <Button size="sm" variant="outline" className="mt-3 w-full">
                  Générer en PDF
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
