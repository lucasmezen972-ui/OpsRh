create table if not exists ai_assistant_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  hr_case_id uuid references hr_cases(id) on delete set null,
  request_type text not null,
  prompt text,
  result_subject text not null,
  result_body text not null,
  result_actions text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists signature_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  hr_case_id uuid references hr_cases(id) on delete set null,
  title text not null,
  signer_name text not null,
  signer_email text,
  document_body text not null,
  status text not null default 'signature_demandee',
  signature_value text,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists document_analyses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid references documents(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  hr_case_id uuid references hr_cases(id) on delete set null,
  filename text not null,
  detected_type text not null,
  confidence numeric not null default 0,
  expiration_date date,
  issues text[] not null default '{}',
  summary text not null,
  suggested_status text not null,
  created_at timestamptz not null default now()
);

create table if not exists inbound_imports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  hr_case_id uuid references hr_cases(id) on delete set null,
  source text not null check (source in ('whatsapp', 'email')),
  raw_content text not null,
  parsed_title text not null,
  parsed_summary text not null,
  suggested_action text not null,
  created_task_id uuid references tasks(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table ai_assistant_runs enable row level security;
alter table signature_requests enable row level security;
alter table document_analyses enable row level security;
alter table inbound_imports enable row level security;

drop policy if exists "owner gere historique ia" on ai_assistant_runs;
create policy "owner gere historique ia" on ai_assistant_runs
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "owner gere signatures" on signature_requests;
create policy "owner gere signatures" on signature_requests
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "owner gere analyses documents" on document_analyses;
create policy "owner gere analyses documents" on document_analyses
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "owner gere imports entrants" on inbound_imports;
create policy "owner gere imports entrants" on inbound_imports
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
