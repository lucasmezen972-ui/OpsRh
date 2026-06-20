"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CheckoutButtons() {
  const [pending, setPending] = useState<"month" | "year" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(interval: "month" | "year") {
    setPending(interval);
    setError(null);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error ?? "Checkout indisponible.");
      window.location.href = payload.url;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout indisponible.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Button onClick={() => startCheckout("month")} disabled={pending !== null}>
          {pending === "month" ? "Ouverture..." : "Commencer mon essai mensuel"}
        </Button>
        <Button variant="outline" onClick={() => startCheckout("year")} disabled={pending !== null}>
          {pending === "year" ? "Ouverture..." : "Choisir l'annuel"}
        </Button>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
