"use client";

import { useFormState } from "react-dom";
import {
  Upload,
  Sparkles,
  BarChart3,
  PenTool,
  ScanLine,
  Inbox,
  Blocks,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ADVANCED_MODULES, type ModuleStatus } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import type { UserSettings } from "@/lib/supabase/settings";
import { updateProfileAction, updateUserSettingsAction } from "./actions";

const ICONS: Record<string, LucideIcon> = { Sparkles, BarChart3, PenTool, ScanLine, Inbox };

const STATUS_META: Record<ModuleStatus, { label: string; variant: "neutral" | "info" | "success" }> = {
  bientot: { label: "Bientôt disponible", variant: "info" },
  active: { label: "Activé", variant: "success" },
  non_active: { label: "Non activé", variant: "neutral" },
};

const TEMPLATE_TOKENS = ["{{contact}}", "{{dossier}}", "{{liste_documents}}", "{{date}}", "{{signature}}"];
const INITIAL_STATE = { ok: false, message: "" };

export function ParametresView({
  profile,
  settings,
  isDemo,
}: {
  profile: Profile;
  settings: UserSettings;
  isDemo: boolean;
}) {
  const [profileState, profileAction] = useFormState(updateProfileAction, INITIAL_STATE);
  const [settingsState, settingsAction] = useFormState(updateUserSettingsAction, INITIAL_STATE);

  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres"></PageHeader>

      <Tabs defaultValue="profil">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="modeles">Modèles</TabsTrigger>
          <TabsTrigger value="facturation">Facturation</TabsTrigger>
          <TabsTrigger value="portail">Portail client</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
        </TabsList>

        {/* Profil */}
        <TabsContent value="profil">
          <Card>
            <CardHeader>
              <CardTitle>Profil</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" action={profileAction}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="full_name">Nom complet</Label>
                    <Input id="full_name" name="full_name" defaultValue={profile.full_name} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={profile.email} disabled />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="company_name">Nom commercial</Label>
                    <Input id="company_name" name="company_name" defaultValue={profile.company_name ?? ""} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signature">Signature email</Label>
                  <Textarea id="signature" name="signature" placeholder="Cordialement,&#10;Votre consultant RH" />
                </div>

                <div className="space-y-1.5">
                  <Label>Logo</Label>
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-6 py-8 text-center">
                    <Upload className="mb-2 size-6 text-muted-foreground" />
                    <p className="text-sm font-medium">Déposer un logo</p>
                    <p className="text-xs text-muted-foreground">PNG ou SVG, 2 Mo maximum</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={isDemo}>
                    Enregistrer
                  </Button>
                  {isDemo && <span className="text-xs text-muted-foreground">Connectez-vous pour enregistrer.</span>}
                </div>
                {profileState.message && (
                  <p role="status" className={profileState.ok ? "text-sm text-emerald-600" : "text-sm text-destructive"}>
                    {profileState.message}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modèles */}
        <TabsContent value="modeles">
          <Card>
            <CardHeader>
              <CardTitle>Modèles de mails et documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Les modèles de mails et de documents sont entièrement personnalisables. Utilisez des variables pour
                insérer automatiquement les bonnes informations.
              </p>
              <div className="space-y-2">
                <Label>Variables disponibles</Label>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATE_TOKENS.map((token) => (
                    <Badge key={token} variant="outline" className="font-mono">
                      {token}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
              <Button asChild variant="outline">
                <Link href="/mails">
                  Gérer les modèles de mails <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Facturation */}
        <TabsContent value="facturation">
          <Card>
            <CardHeader>
              <CardTitle>Facturation</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" action={settingsAction}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="default-rate">Tarif horaire par défaut</Label>
                    <Input
                      id="default-rate"
                      name="default_hourly_rate"
                      type="number"
                      min={0}
                      defaultValue={settings.default_hourly_rate}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="currency">Devise</Label>
                    <Select name="currency" defaultValue={settings.currency}>
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mentions">Mentions de pré-facturation</Label>
                  <Textarea
                    id="mentions"
                    name="pre_invoice_mentions"
                    placeholder="Mentions affichées sur vos pré-factures…"
                    defaultValue={settings.pre_invoice_mentions}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Logo PDF</Label>
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-6 py-8 text-center">
                    <Upload className="mb-2 size-6 text-muted-foreground" />
                    <p className="text-sm font-medium">Déposer un logo</p>
                    <p className="text-xs text-muted-foreground">Affiché en haut de vos pré-factures</p>
                  </div>
                </div>

                <Button type="submit" disabled={isDemo}>Enregistrer</Button>
                {settingsState.message && (
                  <p role="status" className={settingsState.ok ? "text-sm text-emerald-600" : "text-sm text-destructive"}>
                    {settingsState.message}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portail client */}
        <TabsContent value="portail">
          <Card>
            <CardHeader>
              <CardTitle>Portail client</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" action={settingsAction}>
                <input type="hidden" name="default_hourly_rate" value={settings.default_hourly_rate} />
                <input type="hidden" name="currency" value={settings.currency} />
                <input type="hidden" name="pre_invoice_mentions" value={settings.pre_invoice_mentions} />
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">Activer le portail client</p>
                    <p className="text-xs text-muted-foreground">
                      Permet à vos clients de se connecter à leur espace sécurisé.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    name="portal_enabled"
                    className="size-4 rounded border-input accent-primary"
                    defaultChecked={settings.portal_enabled}
                  />
                </label>

                <div className="space-y-1.5">
                  <Label htmlFor="welcome">Message d&apos;accueil par défaut</Label>
                  <Input
                    id="welcome"
                    name="portal_welcome_message"
                    placeholder="Bienvenue dans votre espace client"
                    defaultValue={settings.portal_welcome_message}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Vous pouvez personnaliser ce message ainsi que les couleurs et le logo affichés dans le portail de
                  chaque client.
                </p>

                <Button type="submit" disabled={isDemo}>Enregistrer</Button>
                {settingsState.message && (
                  <p role="status" className={settingsState.ok ? "text-sm text-emerald-600" : "text-sm text-destructive"}>
                    {settingsState.message}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules */}
        <TabsContent value="modules">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Modules avancés</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/modules">
                  Gérer <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {ADVANCED_MODULES.map((m) => {
                const Icon = ICONS[m.icon] ?? Blocks;
                const status = STATUS_META[m.status];
                return (
                  <div key={m.key} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600 [&_svg]:size-4">
                      <Icon />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{m.name}</p>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
