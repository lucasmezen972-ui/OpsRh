# Audit production Ops RH

Date : 20 juin 2026  
Branche : `codex/production-saas-stripe`  
Contact officiel : `contact@tradikom.com`

## Commandes initiales

- `npm ci` : OK, avec avertissements de dépendances et audit npm.
- `npm run typecheck` : OK avant modifications.
- `npm run lint` : KO avant modifications, Next demandait une configuration ESLint interactive.
- `npm run build` : OK avant modifications.
- `npm run test:e2e` : KO avant modifications, workflow Mails instable.

## Validation finale locale

- `npm run typecheck` : OK.
- `npm run lint` : OK.
- `npm run build` : OK.
- `npm run test:e2e` : OK, 42 tests passés sur desktop et mobile.

## Routes existantes

Routes applicatives : `/dashboard`, `/clients`, `/clients/[id]`, `/clients/nouveau`, `/dossiers`, `/dossiers/[id]`, `/dossiers/nouveau`, `/taches`, `/documents`, `/mails`, `/temps`, `/pre-facturation`, `/portail`, `/parametres`, `/reporting`, `/modules`.

Routes publiques ajoutées ou confirmées : `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`, `/tarifs`, `/contact`, `/confidentialite`, `/mentions-legales`.

Routes Stripe ajoutées : `/api/stripe/checkout`, `/api/stripe/webhook`, `/api/stripe/customer-portal`, `/abonnement`, `/abonnement/succes`, `/abonnement/annule`.

## Tables Supabase existantes

Schéma initial : `profiles`, `clients`, `client_contacts`, `hr_cases`, `document_checklists`, `checklist_items`, `documents`, `tasks`, `email_templates`, `generated_emails`, `document_templates`, `generated_documents`, `time_entries`, `billing_settings`, `pre_invoices`, `client_requests`, `comments`, `activity_logs`, `notifications`, `user_settings`.

Tables ajoutées pour production : `organizations`, `organization_members`, `subscriptions`, `stripe_webhook_events`, `organization_settings`, `audit_logs`.

## Server actions existantes

Les actions couvrent auth, clients, dossiers, tâches, documents, notifications, paramètres, portail, préfacturation et mails. Plusieurs actions historiques retournaient encore `demo_mode` ou redirigeaient en cas d'absence de session.

## Usages de données fictives

Avant correction, `src/lib/sample-data.ts` et `src/lib/data.ts` alimentaient de nombreuses pages. `sample-data.ts` a été supprimé. `src/lib/data.ts` ne retourne plus de données fictives ; il ne sert plus que de fallback typé vide pendant la transition des pages.

## Fonctions encore fictives ou désactivées

Les modules assistant IA, reporting avancé, signature électronique, analyse automatique des documents et import WhatsApp/e-mail sont marqués `Bientôt disponible` depuis la page Modules.

## Corrections réalisées

- Suppression des clés Supabase codées en dur.
- Ajout de `.env.example` production.
- Ajout de `APP_CONFIG` avec `contact@tradikom.com`.
- Ajout Stripe serveur, Checkout, Webhook signé, Customer Portal.
- Ajout Resend serveur avec `Ops RH <contact@tradikom.com>`.
- Ajout de routes publiques légales et contact.
- Ajout de routes auth inscription, reset, callback.
- Protection middleware des routes privées.
- Ajout migration multi-tenant organisations + abonnements + buckets privés.
- Suppression du fichier `sample-data.ts`.
- Désactivation commerciale des modules avancés.
- Ajout ESLint non interactif.

## Risques et travaux restants

- Certaines pages métier utilisent encore une couche fallback vide : elles doivent être progressivement branchées à des requêtes Supabase multi-tenant strictes.
- Les anciennes politiques RLS owner coexistent avec les nouvelles politiques organisation ; une passe SQL de durcissement doit retirer les politiques owner héritées après migration.
- Les tests Stripe webhook doivent être complétés avec fixtures signées.
- Le portail client complet reste à finaliser au-delà du socle d'accès.
- Les actions métier doivent toutes être migrées vers `ActionResult`.
- Les suppressions RGPD sensibles doivent être terminées avec confirmation forte.
