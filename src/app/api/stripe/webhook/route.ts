import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { APP_CONFIG } from "@/lib/app-config";
import { sendTransactionalEmail } from "@/lib/email/server";
import { getStripe } from "@/lib/stripe/server";
import { syncStripeSubscription } from "@/lib/stripe/subscription-sync";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Signature Stripe manquante." }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("Signature webhook Stripe invalide", error);
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase admin non configuré." }, { status: 500 });

  const { error: eventInsertError } = await supabase.from("stripe_webhook_events").insert({
    id: event.id,
    event_type: event.type,
    payload: event as any,
  });

  if (eventInsertError) {
    if (eventInsertError.code === "23505") return NextResponse.json({ received: true, duplicate: true });
    console.error("Impossible d'enregistrer l'événement Stripe", eventInsertError);
    return NextResponse.json({ error: "Webhook non enregistré." }, { status: 500 });
  }

  try {
    await handleStripeEvent(event);
  } catch (error) {
    console.error("Erreur traitement webhook Stripe", event.type, error);
    return NextResponse.json({ error: "Erreur de traitement." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const subscription = await getStripe().subscriptions.retrieve(String(session.subscription));
        await syncStripeSubscription(subscription, session.metadata?.organization_id);
        await notifyOrganization(session.metadata?.organization_id, "Abonnement activé", "Votre abonnement Ops RH Pro est actif.");
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncStripeSubscription(subscription);
      await notifyOrganization(
        subscription.metadata.organization_id,
        "Abonnement mis à jour",
        `Statut Stripe : ${subscription.status}.`
      );
      break;
    }
    case "customer.subscription.trial_will_end": {
      const subscription = event.data.object as Stripe.Subscription;
      await notifyOrganization(
        subscription.metadata.organization_id,
        "Votre essai Ops RH se termine bientôt",
        `Votre essai se termine le ${subscription.trial_end ? new Date(subscription.trial_end * 1000).toLocaleDateString("fr-FR") : "prochainement"}.`
      );
      break;
    }
    case "invoice.paid":
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      await notifyByCustomer(String(invoice.customer), "Paiement confirmé", "Votre paiement Ops RH a bien été reçu.");
      break;
    }
    case "invoice.payment_failed":
    case "invoice.payment_action_required": {
      const invoice = event.data.object as Stripe.Invoice;
      await notifyByCustomer(
        String(invoice.customer),
        "Paiement Ops RH à régulariser",
        `Votre paiement a échoué. Mettez à jour votre moyen de paiement ou contactez ${APP_CONFIG.contactEmail}.`
      );
      break;
    }
  }
}

async function notifyByCustomer(customerId: string, title: string, message: string) {
  const supabase = createAdminClient();
  if (!supabase) return;

  const { data } = await supabase
    .from("subscriptions")
    .select("organization_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (data?.organization_id) await notifyOrganization(data.organization_id, title, message);
}

async function notifyOrganization(organizationId: string | null | undefined, title: string, message: string) {
  if (!organizationId) return;
  const supabase = createAdminClient();
  if (!supabase) return;

  const { data: members } = await supabase
    .from("organization_members")
    .select("user_id, profiles(email)")
    .eq("organization_id", organizationId)
    .in("role", ["owner", "admin"]);

  await supabase.from("activity_logs").insert({
    organization_id: organizationId,
    action_type: "stripe_event",
    description: message,
  });

  for (const member of members ?? []) {
    await supabase.from("notifications").insert({
      organization_id: organizationId,
      user_id: member.user_id,
      title,
      message,
      type: "abonnement",
      status: "non_lue",
      href: "/parametres?tab=abonnement",
      entity_type: "subscription",
    });

    const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
    if (profile?.email) {
      await sendTransactionalEmail({
        to: profile.email,
        subject: title,
        html: `<p>${message}</p>`,
        idempotencyKey: `${organizationId}-${title}`,
      });
    }
  }
}
