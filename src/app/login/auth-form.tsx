"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { login, signup, type AuthResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <>
          {label} <ArrowRight className="size-4" />
        </>
      )}
    </Button>
  );
}

export function AuthForm({ initialMode = "login" }: { initialMode?: "login" | "signup" }) {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const action = mode === "login" ? login : signup;
  const [state, formAction] = useFormState<AuthResult, FormData>(action, undefined);
  const next = searchParams.get("next") ?? "";

  return (
    <div className="w-full">
      <div className="mb-6 space-y-1.5 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          {mode === "login" ? "Bon retour 👋" : "Créer mon espace"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {mode === "login"
            ? "Connectez-vous pour accéder à votre cockpit Ops RH."
            : "Quelques secondes pour démarrer avec Ops RH."}
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        {mode === "login" && next && <input type="hidden" name="next" value={next} />}
        {mode === "signup" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="full_name">Nom complet</Label>
              <Input id="full_name" name="full_name" placeholder="Lucas Mezen" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_name">Nom commercial</Label>
              <Input id="company_name" name="company_name" placeholder="Mezen RH Conseil" />
            </div>
          </>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="vous@exemple.fr"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
          />
        </div>

        {state?.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

        <SubmitButton label={mode === "login" ? "Se connecter" : "Créer mon espace"} />
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            Pas encore de compte ?{" "}
            <button onClick={() => setMode("signup")} className="font-medium text-primary hover:underline">
              Créer un espace
            </button>
          </>
        ) : (
          <>
            Déjà un compte ?{" "}
            <button onClick={() => setMode("login")} className="font-medium text-primary hover:underline">
              Se connecter
            </button>
          </>
        )}
      </p>

      <div className="mt-4 space-y-2 border-t pt-4 text-center">
        <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
          Mot de passe oublié ?
        </Link>
      </div>
    </div>
  );
}
