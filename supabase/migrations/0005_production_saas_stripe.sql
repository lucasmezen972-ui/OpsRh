-- ============================================================
-- Ops RH production SaaS — organisations, abonnements Stripe,
-- stockage privé et socle RLS multi-tenant.
-- ============================================================

do $$
begin
  if exists (select 1 from pg_type where typname = 'user_role') then
    alter type user_role add value if not exists 'platform_admin';
  end if;
end $$;

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  owner_id uuid not null references profiles(id) on delete cascade,
  logo_url text,
  contact_email text default 'contact@tradikom.com',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz default now(),
  unique (organization_id, user_id)
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references organizations(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  plan_key text not null default 'pro',
  status text not null default 'incomplete',
  billing_interval text check (billing_interval in ('month', 'year')),
  trial_start timestamptz,
  trial_end timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists stripe_webhook_events (
  id text primary key,
  event_type text not null,
  payload jsonb,
  processed_at timestamptz default now()
);

create table if not exists organization_settings (
  organization_id uuid primary key references organizations(id) on delete cascade,
  default_hourly_rate numeric not null default 65 check (default_hourly_rate >= 0),
  currency text not null default 'EUR',
  pre_invoice_mentions text,
  portal_enabled boolean not null default false,
  portal_welcome_message text,
  pdf_logo_url text,
  portal_logo_url text,
  portal_primary_color text,
  billing_address text,
  invoice_number_prefix text default 'OPSRH',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete set null,
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  justification text,
  created_at timestamptz not null default now()
);

create or replace function user_organization_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select organization_id
  from organization_members
  where user_id = auth.uid()
$$;

create or replace function has_active_subscription(organization_uuid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from subscriptions s
    where s.organization_id = organization_uuid
      and (
        s.status in ('trialing', 'active')
        or (s.status = 'past_due' and coalesce(s.current_period_end, now()) + interval '3 days' >= now())
      )
  )
$$;

create or replace function is_platform_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role::text = 'platform_admin'
  )
$$;

insert into organizations (name, owner_id, contact_email)
select coalesce(nullif(company_name, ''), nullif(full_name, ''), email, 'Organisation Ops RH'), id, 'contact@tradikom.com'
from profiles p
where not exists (
  select 1 from organizations o where o.owner_id = p.id
);

insert into organization_members (organization_id, user_id, role)
select o.id, o.owner_id, 'owner'
from organizations o
on conflict (organization_id, user_id) do nothing;

insert into subscriptions (organization_id, status, plan_key, trial_start, trial_end)
select o.id, 'trialing', 'pro', now(), now() + interval '14 days'
from organizations o
where not exists (select 1 from subscriptions s where s.organization_id = o.id);

insert into organization_settings (organization_id)
select o.id
from organizations o
on conflict (organization_id) do nothing;

alter table clients add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table client_contacts add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table hr_cases add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table tasks add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table documents add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table document_checklists add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table checklist_items add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table email_templates add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table generated_emails add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table document_templates add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table generated_documents add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table time_entries add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table billing_settings add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table pre_invoices add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table client_requests add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table comments add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table activity_logs add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table notifications add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table user_settings add column if not exists organization_id uuid references organizations(id) on delete cascade;

update clients t set organization_id = o.id from organizations o where t.organization_id is null and t.owner_id = o.owner_id;
update hr_cases t set organization_id = o.id from organizations o where t.organization_id is null and t.owner_id = o.owner_id;
update tasks t set organization_id = o.id from organizations o where t.organization_id is null and t.owner_id = o.owner_id;
update documents t set organization_id = o.id from organizations o where t.organization_id is null and t.owner_id = o.owner_id;
update document_checklists t set organization_id = o.id from organizations o where t.organization_id is null and t.owner_id = o.owner_id;
update email_templates t set organization_id = o.id from organizations o where t.organization_id is null and t.owner_id = o.owner_id;
update generated_emails t set organization_id = o.id from organizations o where t.organization_id is null and t.owner_id = o.owner_id;
update document_templates t set organization_id = o.id from organizations o where t.organization_id is null and t.owner_id = o.owner_id;
update generated_documents t set organization_id = o.id from organizations o where t.organization_id is null and t.owner_id = o.owner_id;
update time_entries t set organization_id = o.id from organizations o where t.organization_id is null and t.owner_id = o.owner_id;
update billing_settings t set organization_id = o.id from organizations o where t.organization_id is null and t.owner_id = o.owner_id;
update pre_invoices t set organization_id = o.id from organizations o where t.organization_id is null and t.owner_id = o.owner_id;
update comments t set organization_id = o.id from organizations o where t.organization_id is null and t.owner_id = o.owner_id;
update activity_logs t set organization_id = o.id from organizations o where t.organization_id is null and t.owner_id = o.owner_id;
update notifications t set organization_id = o.id from organizations o where t.organization_id is null and t.user_id = o.owner_id;
update user_settings t set organization_id = o.id from organizations o where t.organization_id is null and t.owner_id = o.owner_id;
update client_contacts cc set organization_id = c.organization_id from clients c where cc.organization_id is null and cc.client_id = c.id;
update document_checklists dc set organization_id = c.organization_id from clients c where dc.organization_id is null and dc.client_id = c.id;
update checklist_items ci set organization_id = dc.organization_id from document_checklists dc where ci.organization_id is null and ci.checklist_id = dc.id;
update client_requests cr set organization_id = c.organization_id from clients c where cr.organization_id is null and cr.client_id = c.id;

create index if not exists idx_clients_organization_id on clients(organization_id);
create index if not exists idx_hr_cases_organization_id on hr_cases(organization_id);
create index if not exists idx_tasks_organization_id on tasks(organization_id);
create index if not exists idx_documents_organization_id on documents(organization_id);
create index if not exists idx_time_entries_organization_id on time_entries(organization_id);
create index if not exists idx_notifications_organization_id on notifications(organization_id);

alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table subscriptions enable row level security;
alter table stripe_webhook_events enable row level security;
alter table organization_settings enable row level security;
alter table audit_logs enable row level security;

drop policy if exists "members read organizations" on organizations;
create policy "members read organizations" on organizations
  for select using (id in (select user_organization_ids()) or is_platform_admin());

drop policy if exists "owners update organizations" on organizations;
create policy "owners update organizations" on organizations
  for update using (
    id in (select organization_id from organization_members where user_id = auth.uid() and role in ('owner', 'admin'))
  );

drop policy if exists "members read memberships" on organization_members;
create policy "members read memberships" on organization_members
  for select using (organization_id in (select user_organization_ids()) or is_platform_admin());

drop policy if exists "owners manage memberships" on organization_members;
create policy "owners manage memberships" on organization_members
  for all using (
    organization_id in (select organization_id from organization_members where user_id = auth.uid() and role = 'owner')
  ) with check (
    organization_id in (select organization_id from organization_members where user_id = auth.uid() and role = 'owner')
  );

drop policy if exists "members read subscriptions" on subscriptions;
create policy "members read subscriptions" on subscriptions
  for select using (organization_id in (select user_organization_ids()) or is_platform_admin());

drop policy if exists "members manage organization settings" on organization_settings;
create policy "members manage organization settings" on organization_settings
  for all using (organization_id in (select user_organization_ids()))
  with check (organization_id in (select user_organization_ids()));

drop policy if exists "platform admin reads audit logs" on audit_logs;
create policy "platform admin reads audit logs" on audit_logs
  for select using (organization_id in (select user_organization_ids()) or is_platform_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('documents', 'documents', false, 10485760, array['application/pdf', 'image/png', 'image/jpeg']),
  ('logos', 'logos', false, 10485760, array['image/png', 'image/jpeg']),
  ('generated-pdfs', 'generated-pdfs', false, 10485760, array['application/pdf'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "members read private organization files" on storage.objects;
create policy "members read private organization files" on storage.objects
  for select using (
    bucket_id in ('documents', 'logos', 'generated-pdfs')
    and split_part(name, '/', 1) = 'organizations'
    and split_part(name, '/', 2)::uuid in (select user_organization_ids())
  );

drop policy if exists "members write private organization files" on storage.objects;
create policy "members write private organization files" on storage.objects
  for insert with check (
    bucket_id in ('documents', 'logos', 'generated-pdfs')
    and split_part(name, '/', 1) = 'organizations'
    and split_part(name, '/', 2)::uuid in (select user_organization_ids())
  );

drop policy if exists "members update private organization files" on storage.objects;
create policy "members update private organization files" on storage.objects
  for update using (
    bucket_id in ('documents', 'logos', 'generated-pdfs')
    and split_part(name, '/', 1) = 'organizations'
    and split_part(name, '/', 2)::uuid in (select user_organization_ids())
  ) with check (
    bucket_id in ('documents', 'logos', 'generated-pdfs')
    and split_part(name, '/', 1) = 'organizations'
    and split_part(name, '/', 2)::uuid in (select user_organization_ids())
  );

drop policy if exists "members delete private organization files" on storage.objects;
create policy "members delete private organization files" on storage.objects
  for delete using (
    bucket_id in ('documents', 'logos', 'generated-pdfs')
    and split_part(name, '/', 1) = 'organizations'
    and split_part(name, '/', 2)::uuid in (select user_organization_ids())
  );
