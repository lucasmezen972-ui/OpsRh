-- ============================================================
-- Ops RH — schéma initial
-- PostgreSQL / Supabase
-- ============================================================

-- ----- Types énumérés -----
create type user_role            as enum ('freelance', 'collaborateur', 'client');
create type client_status        as enum ('actif', 'en_pause', 'termine');
create type case_status          as enum ('nouveau','en_cours','en_attente_client','a_completer','bloque','a_valider','termine','archive');
create type case_type            as enum ('embauche','onboarding','suivi_salarie','demande_document','preparation_contrat','rupture','procedure','accompagnement','autre');
create type priority             as enum ('basse','normale','haute','urgente');
create type task_status          as enum ('a_faire','en_cours','en_attente','termine','en_retard');
create type task_type            as enum ('relance_client','demande_document','preparation_document','verification_dossier','appel','point_client','suivi_administratif','facturation','autre');
create type document_status      as enum ('demande','recu','valide','a_corriger','expire','archive');
create type document_type        as enum ('piece_identite','rib','cv','justificatif','contrat','document_signe','fiche_poste','compte_rendu','courrier','rapport','autre');
create type pre_invoice_status   as enum ('a_preparer','a_verifier','prete','exportee','archivee');
create type client_request_status as enum ('nouvelle','en_cours','convertie','close');
create type client_request_type  as enum ('besoin_document','demande_contrat','demande_conseil','demande_relance','demande_administrative','autre');
create type comment_visibility   as enum ('internal','client_visible');
create type notification_status  as enum ('non_lue','lue','traitee');

-- ----- profiles (étend auth.users) -----
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text not null default '',
  role          user_role not null default 'freelance',
  avatar_url    text,
  company_name  text,
  created_at    timestamptz not null default now()
);

-- ----- clients -----
create table clients (
  id                       uuid primary key default gen_random_uuid(),
  owner_id                 uuid not null references profiles(id) on delete cascade,
  name                     text not null,
  sector                   text,
  address                  text,
  siret                    text,
  main_contact_name        text,
  main_contact_email       text,
  main_contact_phone       text,
  status                   client_status not null default 'actif',
  notes                    text,
  collaboration_type       text,
  collaboration_start_date date,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index on clients (owner_id);

-- ----- client_contacts -----
create table client_contacts (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references clients(id) on delete cascade,
  name          text not null,
  email         text,
  phone         text,
  role          text,
  portal_access boolean not null default false,
  created_at    timestamptz not null default now()
);
create index on client_contacts (client_id);

-- ----- hr_cases -----
create table hr_cases (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references profiles(id) on delete cascade,
  client_id      uuid not null references clients(id) on delete cascade,
  title          text not null,
  person_name    text,
  case_type      case_type not null default 'autre',
  description    text,
  status         case_status not null default 'nouveau',
  priority       priority not null default 'normale',
  due_date       date,
  internal_notes text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  archived_at    timestamptz
);
create index on hr_cases (owner_id);
create index on hr_cases (client_id);

-- ----- document_checklists -----
create table document_checklists (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references profiles(id) on delete cascade,
  client_id  uuid references clients(id) on delete cascade,
  hr_case_id uuid references hr_cases(id) on delete cascade,
  title      text not null,
  created_at timestamptz not null default now()
);
create index on document_checklists (hr_case_id);

-- ----- documents -----
create table documents (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references profiles(id) on delete cascade,
  client_id         uuid references clients(id) on delete cascade,
  hr_case_id        uuid references hr_cases(id) on delete cascade,
  checklist_item_id uuid,
  name              text not null,
  file_url          text,
  file_type         text,
  document_type     document_type not null default 'autre',
  status            document_status not null default 'demande',
  expiration_date   date,
  uploaded_by       uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index on documents (owner_id);
create index on documents (client_id);
create index on documents (hr_case_id);

-- ----- checklist_items -----
create table checklist_items (
  id           uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references document_checklists(id) on delete cascade,
  name         text not null,
  required     boolean not null default true,
  status       document_status not null default 'demande',
  document_id  uuid references documents(id) on delete set null,
  comment      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on checklist_items (checklist_id);

-- lien différé documents.checklist_item_id -> checklist_items.id
alter table documents
  add constraint documents_checklist_item_fk
  foreign key (checklist_item_id) references checklist_items(id) on delete set null;

-- ----- tasks -----
create table tasks (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references profiles(id) on delete cascade,
  client_id         uuid references clients(id) on delete cascade,
  hr_case_id        uuid references hr_cases(id) on delete cascade,
  title             text not null,
  description       text,
  type              task_type not null default 'autre',
  status            task_status not null default 'a_faire',
  priority          priority not null default 'normale',
  due_date          date,
  estimated_minutes integer,
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index on tasks (owner_id);
create index on tasks (hr_case_id);

-- ----- email_templates / generated_emails -----
create table email_templates (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references profiles(id) on delete cascade,
  title      text not null,
  type       text not null,
  subject    text not null,
  body       text not null,
  variables  text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table generated_emails (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references profiles(id) on delete cascade,
  client_id   uuid references clients(id) on delete cascade,
  hr_case_id  uuid references hr_cases(id) on delete cascade,
  template_id uuid references email_templates(id) on delete set null,
  subject     text not null,
  body        text not null,
  status      text not null default 'brouillon',
  created_at  timestamptz not null default now()
);

-- ----- document_templates / generated_documents -----
create table document_templates (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references profiles(id) on delete cascade,
  title      text not null,
  type       text not null,
  content    text not null,
  variables  text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table generated_documents (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references profiles(id) on delete cascade,
  client_id   uuid references clients(id) on delete cascade,
  hr_case_id  uuid references hr_cases(id) on delete cascade,
  template_id uuid references document_templates(id) on delete set null,
  title       text not null,
  content     text not null,
  pdf_url     text,
  status      text not null default 'brouillon',
  created_at  timestamptz not null default now()
);

-- ----- time_entries -----
create table time_entries (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references profiles(id) on delete cascade,
  client_id        uuid references clients(id) on delete cascade,
  hr_case_id       uuid references hr_cases(id) on delete cascade,
  task_id          uuid references tasks(id) on delete set null,
  date             date not null default current_date,
  duration_minutes integer not null default 0,
  description      text,
  billable         boolean not null default true,
  hourly_rate      numeric(10,2),
  created_at       timestamptz not null default now()
);
create index on time_entries (owner_id);
create index on time_entries (client_id);

-- ----- billing_settings -----
create table billing_settings (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references profiles(id) on delete cascade,
  client_id        uuid not null references clients(id) on delete cascade,
  hourly_rate      numeric(10,2),
  monthly_retainer numeric(10,2),
  billing_notes    text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (client_id)
);

-- ----- pre_invoices -----
create table pre_invoices (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references profiles(id) on delete cascade,
  client_id    uuid not null references clients(id) on delete cascade,
  period_start date not null,
  period_end   date not null,
  subtotal     numeric(10,2) not null default 0,
  total        numeric(10,2) not null default 0,
  status       pre_invoice_status not null default 'a_preparer',
  pdf_url      text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on pre_invoices (owner_id);

-- ----- client_requests -----
create table client_requests (
  id                   uuid primary key default gen_random_uuid(),
  client_id            uuid not null references clients(id) on delete cascade,
  created_by           uuid,
  title                text not null,
  type                 client_request_type not null default 'autre',
  priority             priority not null default 'normale',
  description          text,
  status               client_request_status not null default 'nouvelle',
  due_date             date,
  converted_to_task_id uuid references tasks(id) on delete set null,
  converted_to_case_id uuid references hr_cases(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index on client_requests (client_id);

-- ----- comments -----
create table comments (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid references profiles(id) on delete cascade,
  client_id         uuid references clients(id) on delete cascade,
  hr_case_id        uuid references hr_cases(id) on delete cascade,
  client_request_id uuid references client_requests(id) on delete cascade,
  body              text not null,
  visibility        comment_visibility not null default 'internal',
  created_by        uuid not null,
  created_at        timestamptz not null default now()
);
create index on comments (hr_case_id);

-- ----- activity_logs -----
create table activity_logs (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references profiles(id) on delete cascade,
  client_id   uuid references clients(id) on delete cascade,
  hr_case_id  uuid references hr_cases(id) on delete cascade,
  action_type text not null,
  description text not null,
  actor_id    uuid,
  created_at  timestamptz not null default now()
);
create index on activity_logs (owner_id);
create index on activity_logs (client_id);

-- ----- notifications -----
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  client_id  uuid references clients(id) on delete cascade,
  hr_case_id uuid references hr_cases(id) on delete cascade,
  title      text not null,
  message    text not null,
  type       text not null,
  status     notification_status not null default 'non_lue',
  created_at timestamptz not null default now()
);
create index on notifications (user_id);

-- ----- création automatique du profil à l'inscription -----
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
