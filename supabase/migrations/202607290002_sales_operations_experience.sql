begin;

alter table public.lead_submissions
  add column if not exists phone text,
  add column if not exists next_follow_up_date date,
  add column if not exists qualification_notes text,
  add column if not exists outcome_reason text;

alter table public.lead_submissions
  drop constraint if exists lead_submissions_phone_length,
  drop constraint if exists lead_submissions_qualification_notes_length,
  drop constraint if exists lead_submissions_outcome_reason_length;

alter table public.lead_submissions
  add constraint lead_submissions_phone_length
    check (phone is null or char_length(phone) <= 50),
  add constraint lead_submissions_qualification_notes_length
    check (qualification_notes is null or char_length(qualification_notes) <= 5000),
  add constraint lead_submissions_outcome_reason_length
    check (outcome_reason is null or char_length(outcome_reason) <= 1000);

create index if not exists lead_submissions_follow_up_idx
  on public.lead_submissions (next_follow_up_date, status)
  where next_follow_up_date is not null
    and status not in ('won', 'lost', 'spam');

create table if not exists public.workspace_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_by uuid not null references auth.users (id) on delete cascade,
  submitted_by_name text not null,
  submitted_by_email text not null,
  category text not null check (category in ('bug', 'feature')),
  impact text not null check (
    impact in ('blocking', 'slowing_work', 'improvement', 'idea')
  ),
  title text not null,
  description text not null,
  expected_outcome text,
  page_path text,
  status text not null default 'new'
    check (status in ('new', 'reviewing', 'planned', 'resolved', 'closed')),
  admin_note text,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  constraint workspace_feedback_submitter_name_length
    check (char_length(trim(submitted_by_name)) between 2 and 100),
  constraint workspace_feedback_submitter_email_length
    check (char_length(submitted_by_email) between 3 and 320),
  constraint workspace_feedback_title_length
    check (char_length(trim(title)) between 4 and 120),
  constraint workspace_feedback_description_length
    check (char_length(trim(description)) between 10 and 4000),
  constraint workspace_feedback_expected_outcome_length
    check (expected_outcome is null or char_length(expected_outcome) <= 2000),
  constraint workspace_feedback_page_path_length
    check (page_path is null or char_length(page_path) <= 500),
  constraint workspace_feedback_admin_note_length
    check (admin_note is null or char_length(admin_note) <= 2000)
);

create index if not exists workspace_feedback_created_idx
  on public.workspace_feedback (created_at desc);

create index if not exists workspace_feedback_status_created_idx
  on public.workspace_feedback (status, created_at desc);

create index if not exists workspace_feedback_submitter_created_idx
  on public.workspace_feedback (submitted_by, created_at desc);

alter table public.workspace_feedback enable row level security;
revoke all on table public.workspace_feedback from anon, authenticated;
grant select, insert, update on table public.workspace_feedback to service_role;

drop trigger if exists set_workspace_feedback_updated_at
  on public.workspace_feedback;
create trigger set_workspace_feedback_updated_at
before update on public.workspace_feedback
for each row execute function public.set_lead_submission_updated_at();

comment on table public.workspace_feedback is
  'Sales workspace feature requests and bug reports, submitted in-app and triaged by administrators.';

comment on column public.lead_submissions.qualification_notes is
  'Internal summary of need, authority, budget confidence, timeline, and overall fit.';

comment on column public.lead_submissions.outcome_reason is
  'Reason for a won, lost, disqualified, or otherwise closed sales outcome.';

commit;
