create table if not exists reporting_reports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  period_start date not null,
  period_end date not null,
  title text not null,
  summary text not null,
  content text not null,
  metrics jsonb not null default '{}',
  vigilance text[] not null default '{}',
  recommendations text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table reporting_reports enable row level security;

drop policy if exists "owner gere rapports" on reporting_reports;
create policy "owner gere rapports" on reporting_reports
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
