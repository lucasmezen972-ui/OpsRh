import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY est manquante.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-05-27.dahlia",
      typescript: true,
    });
  }

  return stripeClient;
}

export function getStripePriceId(interval: "month" | "year") {
  const priceId =
    interval === "month" ? process.env.STRIPE_PRICE_MONTHLY_ID : process.env.STRIPE_PRICE_YEARLY_ID;

  if (!priceId) {
    throw new Error(`Price ID Stripe manquant pour l'intervalle ${interval}.`);
  }

  return priceId;
}
