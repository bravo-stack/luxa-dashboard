do $$
begin
  create type public.lead_origin as enum (
    'website',
    'manual',
    'import',
    'integration'
  );
exception
  when duplicate_object then null;
end
$$;

alter table public.lead_submissions
  add column if not exists origin public.lead_origin;

update public.lead_submissions
set origin = case
  when form_type = 'manual' then 'manual'::public.lead_origin
  else 'website'::public.lead_origin
end
where origin is null;

alter table public.lead_submissions
  alter column origin set default 'website'::public.lead_origin,
  alter column origin set not null;

alter table public.lead_submissions
  add column if not exists owner_user_id uuid
  references auth.users (id) on delete set null;

update public.lead_submissions
set owner_user_id = created_by
where origin = 'manual'::public.lead_origin
  and created_by is not null
  and owner_user_id is null;

create index if not exists lead_submissions_origin_created_at_idx
  on public.lead_submissions (origin, created_at desc);

create index if not exists lead_submissions_owner_user_id_idx
  on public.lead_submissions (owner_user_id, created_at desc)
  where owner_user_id is not null;

comment on column public.lead_submissions.origin is
  'How the lead entered the CRM. Marketing attribution remains in attribution.';

comment on column public.lead_submissions.created_by is
  'Authenticated team member who created the record; null for system ingestion.';

comment on column public.lead_submissions.owner_user_id is
  'Team member responsible for follow-up; reserved for the future assignment workflow.';
