# QA production Ops RH

## Pages vérifiées

Pages publiques : `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/tarifs`, `/contact`, `/confidentialite`, `/mentions-legales`.

Pages privées : les routes applicatives sont maintenant protégées par session Supabase et abonnement.

## Boutons vérifiés ou modifiés

- Checkout mensuel et annuel : route serveur `/api/stripe/checkout`.
- Customer Portal : route serveur `/api/stripe/customer-portal`.
- Modules avancés : boutons désactivés `Bientôt disponible`.
- Contact : formulaire serveur avec validation, consentement et honeypot.

## Corrections réalisées

- Suppression du mode démo visible.
- Suppression de `sample-data.ts`.
- Suppression des clés Supabase codées en dur.
- Ajout Stripe, Resend, pages publiques et migrations multi-tenant.
- Ajout protection de routes.

## Fonctions volontairement désactivées

- Assistant IA.
- Reporting avancé.
- Signature électronique.
- Analyse automatique des documents.
- Import WhatsApp/e-mail.

## Problèmes restants

- Migration complète de toutes les pages métier vers des requêtes Supabase strictement `organization_id`.
- Tests webhook Stripe à enrichir avec signatures réelles.
- Portail client complet à durcir après validation des accès client.
