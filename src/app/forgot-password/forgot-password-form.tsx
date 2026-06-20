"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { resetPassword, type AuthResult } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" disabled={pending}>
      {pending ? "Envoi..." : "Envoyer le lien"}
    </Button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useFormState<AuthResult, FormData>(resetPassword, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      {state?.error && <p role="status" className="rounded-md bg-muted px-3 py-2 text-sm">{state.error}</p>}
      <SubmitButton />
      <Link href="/login" className="block text-center text-sm text-primary hover:underline">
        Retour à la connexion
      </Link>
    </form>
  );
}
