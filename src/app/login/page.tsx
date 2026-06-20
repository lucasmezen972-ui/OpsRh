import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { isAuthenticated } from "@/lib/supabase/session";
import { AuthForm } from "./auth-form";

const HIGHLIGHTS = [
  "Pilotez tous vos clients depuis un seul cockpit",
  "Ne ratez plus une relance ni un document manquant",
  "Préparez votre pré-facturation en quelques clics",
];

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/dashboard");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Colonne marketing */}
      <div className="relative hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-base font-bold">O</div>
          <span className="text-lg font-semibold">Ops RH</span>
        </div>
        <div className="space-y-6">
          <h1 className="text-balance text-3xl font-semibold leading-tight">
            Le cockpit simple et professionnel d&apos;une freelance RH.
          </h1>
          <ul className="space-y-3">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-start gap-3 text-sm text-primary-foreground/90">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-primary-foreground/70">
          Clients · Dossiers RH · Documents · Relances · Pré-facturation
        </p>
      </div>

      {/* Colonne formulaire */}
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8">
          <Suspense>
            <AuthForm />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
