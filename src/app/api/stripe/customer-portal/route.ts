import { NextResponse } from "next/server";
import { APP_CONFIG } from "@/lib/app-config";
import { canManageBilling, requireSession } from "@/lib/auth/access";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const { user } = await requireSession();
    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ error: "Configuration Supabase admin manquante." }, { status: 500 });

    const { data: membership } = await supabase
      .from("organization_members")
      .select("role, organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!membership || !canManageBilling(membership.role)) {
      return NextResponse.json({ error: "Accès abonnement non autorisé." }, { status: 403 });
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("organization_id", membership.organization_id)
      .maybeSingle();

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({ error: "Aucun client Stripe associé." }, { status: 404 });
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${APP_CONFIG.appUrl}/parametres?tab=abonnement`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Erreur Customer Portal Stripe", error);
    return NextResponse.json({ error: "Impossible d'ouvrir le portail Stripe." }, { status: 500 });
  }
}
