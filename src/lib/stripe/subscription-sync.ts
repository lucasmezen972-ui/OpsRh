import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/server";

export function subscriptionPayload(subscription: Stripe.Subscription) {
  const raw = subscription as any;
  const price = subscription.items.data[0]?.price;
  return {
    stripe_subscription_id: subscription.id,
    stripe_customer_id:
      typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
    stripe_price_id: price?.id ?? null,
    billing_interval: price?.recurring?.interval ?? null,
    status: subscription.status,
    current_period_start: raw.current_period_start ? new Date(raw.current_period_start * 1000).toISOString() : null,
    current_period_end: raw.current_period_end ? new Date(raw.current_period_end * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
    trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  };
}

export async function syncStripeSubscription(subscription: Stripe.Subscription, organizationId?: string | null) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("SUPABASE_SERVICE_ROLE_KEY est manquante.");

  const payload = subscriptionPayload(subscription);
  const resolvedOrganizationId =
    organizationId ??
    subscription.metadata.organization_id ??
    (await findOrganizationIdBySubscription(subscription.id, payload.stripe_customer_id));

  if (!resolvedOrganizationId) throw new Error(`Organisation introuvable pour ${subscription.id}.`);

  const { error } = await supabase
    .from("subscriptions")
    .upsert({ ...payload, organization_id: resolvedOrganizationId, plan_key: "pro" }, { onConflict: "organization_id" });

  if (error) throw error;
}

async function findOrganizationIdBySubscription(subscriptionId: string, customerId: string) {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("subscriptions")
    .select("organization_id")
    .or(`stripe_subscription_id.eq.${subscriptionId},stripe_customer_id.eq.${customerId}`)
    .maybeSingle();

  return data?.organization_id ?? null;
}
