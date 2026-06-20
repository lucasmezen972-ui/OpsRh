import { redirect } from "next/navigation";
import { APP_CONFIG, STRIPE_ALLOWED_STATUSES } from "@/lib/app-config";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export interface OrganizationAccess {
  user: {
    id: string;
    email: string | null;
  };
  organization: {
    id: string;
    name: string;
    role: "owner" | "admin" | "member";
  };
  subscription: SubscriptionAccess;
}

export interface SubscriptionAccess {
  allowed: boolean;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  reason: string | null;
}

const ACTIVE_OR_GRACE = new Set(["trialing", "active", "past_due"]);

export async function getCurrentOrganizationAccess(): Promise<OrganizationAccess | null> {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("role, organizations(id, name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership?.organizations) return null;

  const organization = Array.isArray(membership.organizations)
    ? membership.organizations[0]
    : membership.organizations;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, trial_end, current_period_end, cancel_at_period_end")
    .eq("organization_id", organization.id)
    .maybeSingle();

  return {
    user: { id: user.id, email: user.email ?? null },
    organization: {
      id: organization.id,
      name: organization.name,
      role: membership.role as "owner" | "admin" | "member",
    },
    subscription: normalizeSubscriptionAccess(subscription),
  };
}

export async function requireSession() {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) redirect(`/login?error=supabase_config`);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  return { supabase, user };
}

export async function requireActiveSubscription() {
  const access = await getCurrentOrganizationAccess();
  if (!access) redirect("/login");

  if (!access.subscription.allowed) {
    redirect(`/tarifs?reason=${encodeURIComponent(access.subscription.reason ?? "subscription_required")}`);
  }

  return access;
}

export async function getSubscriptionAccess(): Promise<SubscriptionAccess> {
  const access = await getCurrentOrganizationAccess();
  return access?.subscription ?? {
    allowed: false,
    status: "missing",
    trialEndsAt: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    reason: "Aucun abonnement Ops RH n'est associé à ce compte.",
  };
}

function normalizeSubscriptionAccess(row: any): SubscriptionAccess {
  if (!row) {
    return {
      allowed: false,
      status: "missing",
      trialEndsAt: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      reason: "Aucun abonnement Ops RH n'est associé à cette organisation.",
    };
  }

  const status = String(row.status ?? "incomplete");
  const allowed =
    STRIPE_ALLOWED_STATUSES.has(status) ||
    (status === "past_due" && isWithinGracePeriod(row.current_period_end));

  return {
    allowed,
    status,
    trialEndsAt: row.trial_end ?? null,
    currentPeriodEnd: row.current_period_end ?? null,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    reason: allowed
      ? null
      : `Votre accès Ops RH est bloqué (${status}). Gérez votre abonnement ou contactez ${APP_CONFIG.contactEmail}.`,
  };
}

function isWithinGracePeriod(currentPeriodEnd: string | null | undefined) {
  if (!currentPeriodEnd) return false;
  const graceEnds = new Date(currentPeriodEnd).getTime() + 3 * 24 * 60 * 60 * 1000;
  return Date.now() <= graceEnds;
}

export function canManageBilling(role: string) {
  return role === "owner" || role === "admin";
}
