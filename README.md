# Ops RH

**Le cockpit simple et professionnel d'une freelance RH.**

Ops RH aide les freelances RH à piloter leurs clients, leurs dossiers, leurs documents, leurs relances et leur pré-facturation depuis une seule web app.

C'est un outil de **pilotage opérationnel** pour freelance / petite structure RH qui accompagne des TPE/PME — pas un SIRH complet pour grandes entreprises.

---

## ✨ Fonctionnalités (v1)

Cœur principal :

| Page | Question à laquelle elle répond |
| --- | --- |
| **Dashboard** « À traiter aujourd'hui » | Que dois-je traiter aujourd'hui ? |
| **Clients** | Quels clients je gère ? |
| **Dossiers RH** | Où en sont mes dossiers ? |
| **Tâches & relances** | Que dois-je faire ? |
| **Documents & checklists** | Qu'est-ce qui manque ? |
| **Mails & modèles** | Que puis-je générer ? |
| **Temps passé** | Combien de temps ai-je travaillé ? |
| **Pré-facturation** | Que dois-je facturer ? |
| **Portail client** | Que voit mon client ? |

Plus : centre de notifications, historique d'activité, paramètres, et une section **Modules** qui prépare (sans les imposer) les fonctions avancées : IA, reporting, signature électronique, analyse automatique des documents, import WhatsApp/Email.

## 🧱 Stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** + composants **shadcn/ui** (Radix UI)
- **Supabase** : PostgreSQL, Auth, Storage, Row Level Security
- Déploiement **Vercel**
- Prévu : Stripe (paiement), Resend (emails), OpenAI (module IA), génération PDF côté serveur

## 🚀 Démarrage

```bash
npm install
cp .env.example .env.local   # puis renseignez vos clés Supabase
npm run dev
```

Ouvrez http://localhost:3000 — vous arrivez sur `/login`, puis le dashboard.

> **Mode démo** : tant qu'aucun projet Supabase n'est connecté, l'app fonctionne
> avec un jeu de **données d'exemple** (clients *Alpha Services* et *Caraïbes
> Distribution*, dossiers, tâches, documents…). Toute l'interface est navigable
> immédiatement.

## 🗄️ Base de données Supabase

Les migrations SQL se trouvent dans [`supabase/migrations`](./supabase/migrations) :

- `0001_init.sql` — types énumérés, 19 tables, contraintes, trigger de création de profil.
- `0002_rls.sql` — Row Level Security (isolation stricte entre freelances, portail client cloisonné, notes internes jamais exposées).
- `supabase/seed.sql` — données de démonstration.

Application via la **CLI Supabase** :

```bash
supabase db push          # applique les migrations
psql "$DATABASE_URL" -f supabase/seed.sql   # (optionnel) seed démo
```

ou collez le contenu des fichiers dans le **SQL Editor** du dashboard Supabase.

### Modèle de données (résumé)

`profiles · clients · client_contacts · hr_cases · tasks · documents ·
document_checklists · checklist_items · email_templates · generated_emails ·
document_templates · generated_documents · time_entries · billing_settings ·
pre_invoices · client_requests · comments · activity_logs · notifications`

## 🔒 Sécurité & confidentialité

- Authentification Supabase Auth.
- **RLS** activée sur toutes les tables : chaque freelance ne voit que ses données.
- Portail client cloisonné via `client_contacts.portal_access` + correspondance email.
- Les **notes internes** (`hr_cases.internal_notes`, commentaires `internal`) ne sont jamais exposées au portail client.
- Le client ne voit que les données de **son** entreprise.

## 🏗️ Architecture du code

```
src/
├── app/
│   ├── (app)/              # espace freelance (sidebar + topbar)
│   │   ├── dashboard, clients, dossiers, taches, documents,
│   │   │   mails, temps, pre-facturation, portail, modules, parametres
│   ├── login/              # authentification
│   └── layout.tsx, globals.css
├── components/
│   ├── ui/                 # primitives shadcn/ui
│   ├── shared/             # PageHeader, StatCard, StatusBadge, EmptyState
│   └── layout/             # Sidebar, Topbar, Notifications
└── lib/
    ├── types.ts            # types métier (alignés sur le schéma SQL)
    ├── constants.ts        # libellés + couleurs des statuts/priorités
    ├── data.ts             # couche d'accès (à brancher sur Supabase)
    ├── sample-data.ts      # données de démonstration
    ├── utils.ts            # helpers de formatage (dates, €, durées)
    └── supabase/           # clients browser/server
```

**Couche de données.** Aujourd'hui `src/lib/data.ts` lit des données en mémoire.
Pour passer en production, remplacez chaque fonction par sa requête Supabase
équivalente — les composants UI n'ont pas besoin d'être modifiés.

## 🗺️ Roadmap

1. ✅ Cœur fonctionnel (v1, interface complète + schéma + RLS)
2. Branchement complet sur Supabase (CRUD réel, Storage, Auth)
3. Génération PDF (comptes rendus, synthèses, pré-factures)
4. Notifications email (Resend)
5. Modules avancés : IA, reporting, signature, analyse documents, import WhatsApp/Email
