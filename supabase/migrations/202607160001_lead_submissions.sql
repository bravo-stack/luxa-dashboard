create extension if not exists pgcrypto;

create table if not exists public.lead_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'new' check (
    status in ('new', 'contacted', 'qualified', 'won', 'lost', 'spam')
  ),
  form_type text not null check (form_type in ('quick_start', 'platform_audit')),
  idempotency_key uuid not null unique,
  locale text not null check (locale in ('en', 'ar')),
  pathname text not null,
  full_name text not null,
  email text not null,
  company text not null,
  website text,
  project_type text not null,
  industry text,
  system_status text,
  problems text,
  improve_first text,
  budget text,
  timeline text,
  decision_stage text,
  context text,
  next_step text,
  attribution jsonb not null default '{}'::jsonb,
  source_hash text,
  internal_notes text
);

create index if not exists lead_submissions_created_at_idx
  on public.lead_submissions (created_at desc);
create index if not exists lead_submissions_status_idx
  on public.lead_submissions (status, created_at desc);
create index if not exists lead_submissions_email_idx
  on public.lead_submissions (lower(email));
create index if not exists lead_submissions_source_hash_idx
  on public.lead_submissions (source_hash, created_at desc)
  where source_hash is not null;

alter table public.lead_submissions enable row level security;

revoke all on table public.lead_submissions from anon, authenticated;

create or replace function public.set_lead_submission_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_lead_submission_updated_at on public.lead_submissions;
create trigger set_lead_submission_updated_at
before update on public.lead_submissions
for each row execute function public.set_lead_submission_updated_at();
