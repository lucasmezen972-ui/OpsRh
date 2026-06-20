# Configuration Supabase

Variables requises :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

La clé `SUPABASE_SERVICE_ROLE_KEY` est uniquement serveur. Elle ne doit jamais être exposée au navigateur.

## Migrations

Appliquer les migrations dans l'ordre :

1. `0001_init.sql`
2. `0002_rls.sql`
3. `0003_functional_audit.sql`
4. `0004_premium_modules.sql`
5. `0005_production_saas_stripe.sql`

La migration production crée :

- organisations ;
- membres d'organisation ;
- abonnements ;
- événements webhook Stripe ;
- paramètres organisation ;
- audit logs ;
- colonnes `organization_id` sur les tables métier ;
- buckets privés `documents`, `logos`, `generated-pdfs`.

## Stockage

Chemins recommandés :

- `organizations/{organization_id}/clients/{client_id}/cases/{case_id}/{uuid}-{filename}`
- `organizations/{organization_id}/logos/{uuid}-{filename}`
- `organizations/{organization_id}/pdfs/{uuid}-{filename}`

Les buckets doivent rester privés.

## RLS

La fonction `user_organization_ids()` limite les lectures aux organisations dont l'utilisateur est membre. La fonction `has_active_subscription()` retourne vrai pour `trialing`, `active` et `past_due` dans une grâce de 3 jours.

Avant production stricte, retirer les anciennes politiques owner héritées une fois la migration des données validée.
