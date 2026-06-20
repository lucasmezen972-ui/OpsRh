import { NextResponse, type NextRequest } from "next/server";
import { APP_CONFIG } from "@/lib/app-config";
import { canManageBilling, requireSession } from "@/lib/auth/access";
import { getStripe, getStripePriceId } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireSession();
    const body = (await request.json().catch(() => ({}))) as { interval?: "month" | "year" };
    const interval = body.interval === "year" ? "year" : "month";
    const priceId = getStripePriceId(interval);
    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ error: "Configuration Supabase admin manquante." }, { status: 500 });

    const { data: membership } = await supabase
      .from("organization_members")
      .select("role, organizations(id, name), subscriptions(stripe_customer_id, status, trial_start)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    const organization = Array.isArray(membership?.organizations)
      ? membership?.organizations[0]
      : membership?.organizations;

    if (!membership || !organization) {
      return NextResponse.json({ error: "Organisation introuvable." }, { status: 403 });
    }

    if (!canManageBilling(membership.role)) {
      return NextResponse.json({ error: "Vous n'êtes pas autorisé à gérer l'abonnement." }, { status: 403 });
    }

    const subscription = Array.isArray(membership.subscriptions)
      ? membership.subscriptions[0]
      : membership.subscriptions;

    if (subscription?.status === "active" || subscription?.status === "trialing") {
      return NextResponse.json({ error: "Un abonnement est déjà actif." }, { status: 409 });
    }

    const stripe = getStripe();
    let customerId = subscription?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: organization.name,
        metadata: {
          organization_id: organization.id,
          user_id: user.id,
        },
      });
      customerId = customer.id;

      await supabase
        .from("subscriptions")
        .update({ stripe_customer_id: customerId })
        .eq("organization_id", organization.id);
    }

    const hasUsedTrial = Boolean(subscription?.trial_start);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: hasUsedTrial ? undefined : 14,
        metadata: {
          organization_id: organization.id,
          user_id: user.id,
          plan_key: "pro",
        },
      },
      metadata: {
        organization_id: organization.id,
        user_id: user.id,
        plan_key: "pro",
      },
      success_url: `${APP_CONFIG.appUrl}/abonnement/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_CONFIG.appUrl}/abonnement/annule`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Erreur Checkout Stripe", error);
    return NextResponse.json({ error: "Impossible de créer la session Stripe." }, { status: 500 });
  }
}
