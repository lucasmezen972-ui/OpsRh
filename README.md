# Ops RH

Ops RH est une application SaaS pour freelances RH, consultants RH indépendants et petits cabinets RH.

Contact officiel : `contact@tradikom.com`

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth, PostgreSQL, Storage et RLS
- Stripe Checkout, Billing Portal et webhooks
- Resend pour les e-mails transactionnels
- Playwright pour les tests E2E

## Installation locale

```bash
npm ci
cp .env.example .env.local
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

## Variables d'environnement

Voir `.env.example`.

Les secrets suivants restent uniquement côté serveur :

- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`

## Supabase

Appliquer les migrations dans `supabase/migrations`. La migration production ajoute les organisations, membres, abonnements Stripe, buckets privés et politiques RLS multi-tenant.

Documentation : `SUPABASE_SETUP.md`.

## Stripe

Produit recommandé : `Ops RH Pro`.

Créer deux Price ID, mensuel et annuel, puis configurer :

- `STRIPE_PRICE_MONTHLY_ID`
- `STRIPE_PRICE_YEARLY_ID`

Documentation : `STRIPE_SETUP.md`.

## E-mails

Tous les e-mails utilisent :

- From : `Ops RH <contact@tradikom.com>`
- Reply-To : `contact@tradikom.com`

Documentation : `EMAIL_SETUP.md`.

## Déploiement

Déployer sur Vercel après configuration des variables Supabase, Stripe, Resend et contact.

Checklist : `DEPLOYMENT_CHECKLIST.md`.

## Sécurité

- Pas de clé Supabase codée en dur.
- Pas de clé Stripe secrète exposée au navigateur.
- Webhook Stripe signé et idempotent.
- Données métier isolées par `organization_id`.
- Buckets Storage privés.
- Modules avancés non commercialisés désactivés.

## Documents de suivi

- `PRODUCTION_AUDIT.md`
- `QA_REPORT.md`
- `SUPABASE_SETUP.md`
- `STRIPE_SETUP.md`
- `EMAIL_SETUP.md`
- `DEPLOYMENT_CHECKLIST.md`
