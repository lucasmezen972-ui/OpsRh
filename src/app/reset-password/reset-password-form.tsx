"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updatePassword, type AuthResult } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" disabled={pending}>
      {pending ? "Mise à jour..." : "Changer le mot de passe"}
    </Button>
  );
}

export function ResetPasswordForm() {
  const [state, formAction] = useFormState<AuthResult, FormData>(updatePassword, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Nouveau mot de passe</Label>
        <Input id="password" name="password" type="password" minLength={8} required />
      </div>
      {state?.error && <p role="status" className="rounded-md bg-muted px-3 py-2 text-sm">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
