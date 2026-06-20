import Link from "next/link";
import { CheckCircle2, Circle, Rocket, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { OnboardingStatus } from "@/lib/supabase/onboarding";

interface Step {
  key: keyof Pick<OnboardingStatus, "hasClient" | "hasCase" | "hasChecklist" | "hasTask" | "hasPortalContact">;
  label: string;
  href: string;
  cta: string;
}

const STEPS: Step[] = [
  { key: "hasClient", label: "Créer mon premier client", href: "/clients/nouveau", cta: "Créer un client" },
  { key: "hasCase", label: "Créer mon premier dossier RH", href: "/dossiers/nouveau", cta: "Créer un dossier" },
  { key: "hasChecklist", label: "Ajouter une checklist de documents", href: "/dossiers/nouveau", cta: "Ajouter une checklist" },
  { key: "hasTask", label: "Créer une tâche", href: "/taches", cta: "Créer une tâche" },
  { key: "hasPortalContact", label: "Inviter un client au portail", href: "/clients", cta: "Inviter au portail" },
];

export function OnboardingCard({ status }: { status: OnboardingStatus }) {
  const nextStep = STEPS.find((s) => !status[s.key]);
  const pct = Math.round((status.done / status.total) * 100);

  return (
    <Card className="border-primary/30 bg-accent/40">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Rocket className="size-5 text-primary" /> Bienvenue sur Ops RH — premiers pas
        </CardTitle>
        <span className="text-sm font-medium text-muted-foreground">
          {status.done}/{status.total}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>

        <ul className="space-y-2">
          {STEPS.map((step) => {
            const done = status[step.key];
            return (
              <li key={step.key} className="flex items-center gap-3">
                {done ? (
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="size-5 shrink-0 text-muted-foreground" />
                )}
                <span className={done ? "text-sm text-muted-foreground line-through" : "text-sm font-medium"}>
                  {step.label}
                </span>
                {!done && step === nextStep && (
                  <Button asChild size="sm" variant="outline" className="ml-auto shrink-0">
                    <Link href={step.href}>
                      {step.cta} <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
