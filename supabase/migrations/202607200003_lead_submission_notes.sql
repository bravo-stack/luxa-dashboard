create table if not exists public.lead_submission_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.lead_submissions (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  body text not null check (char_length(trim(body)) > 0)
);

create index if not exists lead_submission_notes_lead_created_idx
  on public.lead_submission_notes (lead_id, created_at desc);

alter table public.lead_submission_notes enable row level security;
revoke all on table public.lead_submission_notes from anon, authenticated;

insert into public.lead_submission_notes (
  lead_id,
  created_at,
  updated_at,
  created_by,
  body
)
select
  lead.id,
  lead.updated_at,
  lead.updated_at,
  lead.created_by,
  lead.internal_notes
from public.lead_submissions as lead
where nullif(trim(lead.internal_notes), '') is not null
and not exists (
  select 1
  from public.lead_submission_notes as note
  where note.lead_id = lead.id
);

drop trigger if exists set_lead_submission_note_updated_at
  on public.lead_submission_notes;
create trigger set_lead_submission_note_updated_at
before update on public.lead_submission_notes
for each row execute function public.set_lead_submission_updated_at();

comment on table public.lead_submission_notes is
  'Private, independently editable CRM notes attached to canonical lead submissions.';
