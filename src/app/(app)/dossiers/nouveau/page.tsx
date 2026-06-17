"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getClients } from "@/lib/data";
import { CASE_STATUS, CASE_TYPE, PRIORITY } from "@/lib/constants";

export default function NouveauDossierPage() {
  const router = useRouter();
  const clients = getClients();

  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [personName, setPersonName] = useState("");
  const [caseType, setCaseType] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normale");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("nouveau");
  const [internalNotes, setInternalNotes] = useState("");
  const [docs, setDocs] = useState(["", ""]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Démo : aucune persistance, on revient à la liste des dossiers.
    router.push("/dossiers");
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
        <Link href="/dossiers">
          <ArrowLeft className="size-4" /> Retour aux dossiers
        </Link>
      </Button>

      <PageHeader title="Nouveau dossier RH" description="Créez un dossier pour suivre une situation RH." />

      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informations du dossier</CardTitle>
              <CardDescription>Les champs marqués sont nécessaires pour un suivi efficace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre du dossier</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex. Embauche développeur — Jean Dupont"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Client associé</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
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

                <div className="space-y-2">
                  <Label htmlFor="person">Personne concernée (optionnel)</Label>
                  <Input
                    id="person"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder="Ex. Jean Dupont"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type de dossier</Label>
                  <Select value={caseType} onValueChange={setCaseType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CASE_TYPE).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priorité</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY).map(([value, meta]) => (
                        <SelectItem key={value} value={value}>
                          {meta.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contexte, objectif du dossier, points d'attention…"
                  rows={4}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="due">Date limite</Label>
                  <Input
                    id="due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Statut initial</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CASE_STATUS).map(([value, meta]) => (
                        <SelectItem key={value} value={value}>
                          {meta.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents attendus</CardTitle>
              <CardDescription>Listez les documents à demander au client pour ce dossier.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {docs.map((doc, i) => (
                <div key={i} className="space-y-2">
                  <Label htmlFor={`doc-${i}`}>Document {i + 1}</Label>
                  <Input
                    id={`doc-${i}`}
                    value={doc}
                    onChange={(e) =>
                      setDocs((prev) => prev.map((d, idx) => (idx === i ? e.target.value : d)))
                    }
                    placeholder="Ex. Pièce d'identité"
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDocs((prev) => [...prev, ""])}
              >
                Ajouter un document
              </Button>
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
              <Textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Remarques privées sur ce dossier…"
                rows={6}
              />
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
    </div>
  );
}
