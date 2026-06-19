-- Additions required by the functional audit.
-- This migration is intentionally additive because 0001_init.sql is empty in this checkout.

alter table if exists profiles
  add column if not exists email_signature text,
  add column if not exists logo_url text;

alter table if exists notifications
  add column if not exists href text,
  add column if not exists entity_type text,
  add column if not exists entity_id uuid;

alter table if exists generated_emails
  add column if not exists sent_at timestamptz;

create table if not exists user_settings (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  default_hourly_rate numeric not null default 65 check (default_hourly_rate >= 0),
  currency text not null default 'EUR',
  pre_invoice_mentions text,
  portal_enabled boolean not null default true,
  portal_welcome_message text,
  pdf_logo_url text,
  portal_logo_url text,
  portal_primary_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_settings enable row level security;

drop policy if exists "owner gere ses parametres" on user_settings;
create policy "owner gere ses parametres" on user_settings
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760,
  array['application/pdf', 'image/png', 'image/jpeg']
)
on conflict (id) do update
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['application/pdf', 'image/png', 'image/jpeg'];

drop policy if exists "owner lit ses fichiers documents" on storage.objects;
create policy "owner lit ses fichiers documents" on storage.objects
  for select using (
    bucket_id = 'documents'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "owner ajoute ses fichiers documents" on storage.objects;
create policy "owner ajoute ses fichiers documents" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "owner modifie ses fichiers documents" on storage.objects;
create policy "owner modifie ses fichiers documents" on storage.objects
  for update using (
    bucket_id = 'documents'
    and split_part(name, '/', 1) = auth.uid()::text
  ) with check (
    bucket_id = 'documents'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "owner supprime ses fichiers documents" on storage.objects;
create policy "owner supprime ses fichiers documents" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and split_part(name, '/', 1) = auth.uid()::text
  );
