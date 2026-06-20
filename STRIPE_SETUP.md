# Configuration Stripe

Produit : `Ops RH Pro`

Variables requises :

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_MONTHLY_ID`
- `STRIPE_PRICE_YEARLY_ID`

## Étapes

1. Créer un produit Stripe `Ops RH Pro`.
2. Créer un prix mensuel et un prix annuel.
3. Copier les identifiants `price_...` dans Vercel.
4. Configurer le webhook vers `https://ops-rh.vercel.app/api/stripe/webhook`.
5. Activer les événements :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.payment_action_required`
6. Configurer le Customer Portal Stripe.

Le webhook est la source de vérité. La page `/abonnement/succes` n'active jamais elle-même un abonnement.

Utiliser des clés test en Preview et des clés live uniquement en Production.
