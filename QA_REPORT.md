# Rapport QA Ops RH

## Périmètre testé

Pages couvertes localement en desktop 1440x900 et mobile 390x844 avec Chromium :

- `/login`
- `/dashboard`
- `/clients`
- `/clients/nouveau`
- `/clients/c1`
- `/dossiers`
- `/dossiers/nouveau`
- `/dossiers/d1`
- `/taches`
- `/documents`
- `/mails`
- `/temps`
- `/pre-facturation`
- `/portail`
- `/espace-client`
- `/modules`
- `/modules/ia`
- `/modules/reporting`
- `/modules/signature`
- `/modules/analyse`
- `/modules/import`
- `/parametres`

Version déployée testée avec `PLAYWRIGHT_BASE_URL=https://ops-rh.vercel.app` sur le smoke navigation. Résultat : routes existantes OK, mais `/espace-client` et la recherche globale échouent sur la production actuelle car ces changements ne sont pas encore déployés.

## Boutons et interactions testés

- Connexion, mauvais mot de passe, bascule inscription, exploration démo.
- Sidebar desktop, menu mobile, menu utilisateur.
- Recherche globale : saisie, popover, type de résultat, navigation clavier.
- Notifications : ouverture, état non lu, marquage lu/tout lu, navigation contextuelle.
- Documents : ajout avec champ fichier, validation format/taille côté serveur, téléchargement via URL signée, statut, suppression, relance groupée contextuelle.
- Dossiers : relance contextuelle, marquer reçu, valider, désactivation explicite en mode démo.
- Mails : génération, édition, copie, brouillon local/Supabase, marquage envoyé, création de modèle, PDF document désactivé.
- Temps : date locale navigateur, validation durée/tarif/client/date, suppression confirmée.
- Pré-facturation : export PDF desktop avec téléchargement navigateur, statut exporté si Supabase disponible.
- Paramètres : profil et paramètres utilisateur reliés à Supabase avec messages.
- Modules : assistant IA, reporting, signature électronique, analyse de documents et import WhatsApp/Email ouverts depuis `/modules`.

## Corrections réalisées

- Recherche globale fonctionnelle via `/api/search`, Supabase RLS si connecté, fallback démo.
- Notifications avec `href`, `entity_type`, `entity_id`, actions lu/tout lu.
- Upload réel Supabase Storage pour documents, bucket privé `documents`, URLs signées.
- Export PDF de pré-facturation côté navigateur.
- Server Actions modifiées pour renvoyer les erreurs au lieu d’échouer silencieusement sur les chemins touchés.
- Liens contextuels ajoutés : tâches, relances, temps, nouveau dossier depuis client.
- Paramètres persistants via `user_settings`.
- Route séparée `/espace-client` sans notes internes.
- Assistant IA opérationnel par génération structurée : relance, synthèse, prochaines actions, mail libre, avec historique Supabase si connecté.
- Reporting avancé opérationnel : rapport client/période, indicateurs dossiers/tâches/documents/temps, points de vigilance, recommandations, téléchargement Markdown et historique Supabase si connecté.
- Signature électronique interne : création de demande, signature horodatée, persistance Supabase et téléchargement de preuve texte.
- Analyse automatique de documents : détection par règles du type RH, confiance, points à vérifier, statut conseillé et historique Supabase.
- Import WhatsApp/Email : collage d'un message entrant, résumé, classification, priorité et création de tâche si Supabase est disponible.
- Playwright configuré pour local et `PLAYWRIGHT_BASE_URL`.

## Fonctions volontairement désactivées

- Génération PDF des modèles de documents.
- Invitation portail complète par magic link.
- Dépôt client final depuis `/espace-client`.

Les éléments non finalisés restent affichés comme “Bientôt disponible” avec boutons désactivés.

## Problèmes restants

- `supabase/migrations/0001_init.sql` est vide dans le dépôt ; la migration ajoutée est additive et suppose le schéma applicatif déjà présent côté Supabase.
- Le portail client complet nécessite la finalisation auth client/magic link et l’isolation réelle avec données Supabase de production.
- Les nouveaux modules IA, reporting, signature, analyse et import sont des versions internes sans fournisseur tiers : pas d'appel LLM externe, pas de BI externe, pas de prestataire eIDAS, pas d'OCR natif, pas de connexion directe à WhatsApp ou à une boîte email. Ils restent fonctionnels par génération/règles/collage manuel et persistance Supabase.
- Le téléchargement PDF mobile est couvert par le rendu de page mais le test d’événement `download` est ignoré sur mobile car Chromium mobile n’émet pas cet événement de façon fiable.
- Next.js 14.2.18 est conservé comme demandé, mais `npm ci` signale encore des vulnérabilités liées aux versions existantes.

## Résultats de validation

- `npm ci` : OK.
- `npm run typecheck` : OK.
- `npm run build` : OK.
- `npm run test:e2e` : OK, 51 passed, 1 skipped documenté.
- Smoke Vercel actuel : routes existantes OK ; échecs attendus sur fonctionnalités non déployées.
