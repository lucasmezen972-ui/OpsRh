import {
  Sparkles,
  BarChart3,
  PenTool,
  ScanLine,
  Inbox,
  Blocks,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ADVANCED_MODULES, type ModuleStatus } from "@/lib/constants";

const ICONS: Record<string, LucideIcon> = {
  Sparkles,
  BarChart3,
  PenTool,
  ScanLine,
  Inbox,
};

const STATUS_META: Record<ModuleStatus, { label: string; variant: "neutral" | "info" | "success" }> = {
  bientot: { label: "Bientôt disponible", variant: "info" },
  active: { label: "Activé", variant: "success" },
  non_active: { label: "Non activé", variant: "neutral" },
};

export default function ModulesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Modules"
        description="Des fonctionnalités avancées, séparées du cœur d'Ops RH."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ADVANCED_MODULES.map((m) => {
          const Icon = ICONS[m.icon] ?? Blocks;
          const status = STATUS_META[m.status];
          return (
            <Card key={m.key} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600 [&_svg]:size-5">
                    <Icon />
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <CardTitle className="pt-3 text-base">{m.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4">
                <p className="text-sm text-muted-foreground">{m.description}</p>
                {m.status === "active" && m.href ? (
                  <Button asChild variant="outline" className="w-full">
                    <Link href={m.href}>Ouvrir</Link>
                  </Button>
                ) : (
                  <Button className="w-full" disabled title="Bientôt disponible : module premium non développé dans cette version.">
                    {m.status === "bientot" ? "Bientôt disponible" : "Activer bientôt"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Blocks className="mt-0.5 size-4 shrink-0" />
        Ces modules n&apos;alourdissent pas l&apos;interface principale : ils restent optionnels et premium. Activez
        uniquement ce dont vous avez besoin, quand vous en avez besoin.
      </p>
    </div>
  );
}
