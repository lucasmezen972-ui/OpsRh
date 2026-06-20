"use client";

import { useFormState, useFormStatus } from "react-dom";
import { sendContactMessage, type ContactResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button disabled={pending}>{pending ? "Envoi..." : "Envoyer"}</Button>;
}

export function ContactForm() {
  const [state, formAction] = useFormState<ContactResult | undefined, FormData>(sendContactMessage, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />
      <div className="space-y-2">
        <Label htmlFor="email">Votre e-mail</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject">Sujet</Label>
        <Input id="subject" name="subject" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" rows={7} required />
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="consent" required className="mt-1" />
        <span>J'accepte qu'Ops RH utilise ces informations pour répondre à ma demande.</span>
      </label>
      {state?.message && (
        <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-600"}>
          {state.message}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
