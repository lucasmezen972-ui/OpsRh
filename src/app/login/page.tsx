import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

const HIGHLIGHTS = [
  "Pilotez tous vos clients depuis un seul cockpit",
  "Ne ratez plus une relance ni un document manquant",
  "Préparez votre pré-facturation en quelques clics",
];

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Colonne marketing */}
      <div className="relative hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-base font-bold">
            O
          </div>
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
          <div className="mb-6 space-y-1.5 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Bon retour 👋</h2>
            <p className="text-sm text-muted-foreground">
              Connectez-vous pour accéder à votre espace Ops RH.
            </p>
          </div>

          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="vous@exemple.fr" defaultValue="lucas.mezen.972@gmail.com" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <Link href="#" className="text-xs text-primary hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <Input id="password" type="password" placeholder="••••••••" defaultValue="demo1234" />
            </div>
            <Button asChild className="w-full">
              <Link href="/dashboard">
                Se connecter <ArrowRight className="size-4" />
              </Link>
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link href="/dashboard" className="font-medium text-primary hover:underline">
              Créer un espace
            </Link>
          </p>

          <p className="mt-4 rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
            Démo : cliquez sur « Se connecter » pour explorer Ops RH avec des données d&apos;exemple.
          </p>
        </Card>
      </div>
    </div>
  );
}
