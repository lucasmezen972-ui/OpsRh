import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/config";

const createSupabaseServerClient = createServerClient as unknown as any;
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/tarifs",
  "/confidentialite",
  "/mentions-legales",
  "/contact",
  "/api/stripe/webhook",
];
const SUBSCRIPTION_FREE_PATHS = ["/parametres", "/abonnement"];
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["trialing", "active"]);

// Rafraîchit la session Supabase à chaque requête (no-op si non configuré).
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isApi = pathname.startsWith("/api/");

  if (!isSupabaseConfigured) {
    if (isPublic || isApi) return NextResponse.next();
    return NextResponse.redirect(new URL("/login?error=supabase_config", request.url));
  }

  let response = NextResponse.next({ request });

  const supabase = createSupabaseServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublic && !isApi) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && !isPublic && !isApi) {
    const canBypassSubscription = SUBSCRIPTION_FREE_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );

    if (!canBypassSubscription) {
      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      const { data: subscription } = membership?.organization_id
        ? await supabase
            .from("subscriptions")
            .select("status, current_period_end")
            .eq("organization_id", membership.organization_id)
            .maybeSingle()
        : { data: null };

      const status = String(subscription?.status ?? "missing");
      const currentPeriodEnd = subscription?.current_period_end
        ? new Date(subscription.current_period_end).getTime()
        : 0;
      const withinPastDueGrace =
        status === "past_due" && Date.now() <= currentPeriodEnd + 3 * 24 * 60 * 60 * 1000;

      if (!ACTIVE_SUBSCRIPTION_STATUSES.has(status) && !withinPastDueGrace) {
        const url = new URL("/tarifs", request.url);
        url.searchParams.set("reason", status);
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
