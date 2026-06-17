-- ============================================================
-- Ops RH — Row Level Security
-- Principe :
--   * La freelance (owner) a un accès complet à SES données uniquement.
--   * Le portail client ne voit que les données de SON entreprise et
--     jamais les notes internes (filtrées au niveau applicatif + colonnes).
-- ============================================================

-- Active RLS partout
alter table profiles            enable row level security;
alter table clients             enable row level security;
alter table client_contacts     enable row level security;
alter table hr_cases            enable row level security;
alter table document_checklists enable row level security;
alter table checklist_items     enable row level security;
alter table documents           enable row level security;
alter table tasks               enable row level security;
alter table email_templates     enable row level security;
alter table generated_emails    enable row level security;
alter table document_templates  enable row level security;
alter table generated_documents enable row level security;
alter table time_entries        enable row level security;
alter table billing_settings    enable row level security;
alter table pre_invoices        enable row level security;
alter table client_requests     enable row level security;
alter table comments            enable row level security;
alter table activity_logs       enable row level security;
alter table notifications       enable row level security;

-- ----- profiles -----
create policy "profil visible par soi" on profiles
  for select using (id = auth.uid());
create policy "profil modifiable par soi" on profiles
  for update using (id = auth.uid());

-- Helper : l'entreprise (client_id) à laquelle l'utilisateur courant
-- a accès via le portail, en faisant correspondre son email.
create or replace function portal_client_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select cc.client_id
  from client_contacts cc
  where cc.portal_access = true
    and lower(cc.email) = lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

-- ----- Macro de politiques « owner » -----
-- clients
create policy "owner gère ses clients" on clients
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "portail lit son entreprise" on clients
  for select using (id in (select portal_client_ids()));

-- client_contacts
create policy "owner gère ses contacts" on client_contacts
  for all using (client_id in (select id from clients where owner_id = auth.uid()))
  with check (client_id in (select id from clients where owner_id = auth.uid()));

-- hr_cases
create policy "owner gère ses dossiers" on hr_cases
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "portail lit ses dossiers" on hr_cases
  for select using (client_id in (select portal_client_ids()));

-- document_checklists
create policy "owner gère ses checklists" on document_checklists
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "portail lit ses checklists" on document_checklists
  for select using (client_id in (select portal_client_ids()));

-- checklist_items (rattachés à une checklist)
create policy "owner gère ses items" on checklist_items
  for all using (checklist_id in (select id from document_checklists where owner_id = auth.uid()))
  with check (checklist_id in (select id from document_checklists where owner_id = auth.uid()));
create policy "portail lit ses items" on checklist_items
  for select using (
    checklist_id in (select id from document_checklists where client_id in (select portal_client_ids()))
  );

-- documents
create policy "owner gère ses documents" on documents
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "portail lit ses documents" on documents
  for select using (client_id in (select portal_client_ids()));
create policy "portail dépose un document" on documents
  for insert with check (client_id in (select portal_client_ids()));

-- tasks (internes, jamais exposées au portail)
create policy "owner gère ses tâches" on tasks
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- email_templates / generated_emails (internes)
create policy "owner gère ses modèles mail" on email_templates
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner gère ses mails générés" on generated_emails
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- document_templates / generated_documents (internes)
create policy "owner gère ses modèles doc" on document_templates
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner gère ses docs générés" on generated_documents
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- time_entries (internes)
create policy "owner gère son temps" on time_entries
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- billing_settings / pre_invoices (internes)
create policy "owner gère sa facturation" on billing_settings
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner gère ses pré-factures" on pre_invoices
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- client_requests : la freelance gère, le portail crée et lit les siennes
create policy "owner gère les demandes" on client_requests
  for all using (client_id in (select id from clients where owner_id = auth.uid()))
  with check (client_id in (select id from clients where owner_id = auth.uid()));
create policy "portail lit ses demandes" on client_requests
  for select using (client_id in (select portal_client_ids()));
create policy "portail crée une demande" on client_requests
  for insert with check (client_id in (select portal_client_ids()));

-- comments : owner tout ; portail lit/écrit uniquement les commentaires
-- « client_visible » de son entreprise (jamais les notes internes).
create policy "owner gère les commentaires" on comments
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "portail lit commentaires visibles" on comments
  for select using (
    visibility = 'client_visible'
    and client_id in (select portal_client_ids())
  );
create policy "portail écrit un commentaire" on comments
  for insert with check (
    visibility = 'client_visible'
    and client_id in (select portal_client_ids())
  );

-- activity_logs (internes)
create policy "owner lit son activité" on activity_logs
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- notifications (destinataire uniquement)
create policy "destinataire gère ses notifications" on notifications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
