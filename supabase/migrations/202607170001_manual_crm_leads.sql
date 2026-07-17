alter table public.lead_submissions
  drop constraint if exists lead_submissions_form_type_check;

alter table public.lead_submissions
  add constraint lead_submissions_form_type_check
  check (form_type in ('quick_start', 'platform_audit', 'manual'));

alter table public.lead_submissions
  add column if not exists created_by uuid references auth.users (id) on delete set null;

create index if not exists lead_submissions_created_by_idx
  on public.lead_submissions (created_by, created_at desc)
  where created_by is not null;
