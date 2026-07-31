begin;

alter table public.lead_submissions
  add column if not exists buyer_function text;

alter table public.lead_submissions
  drop constraint if exists lead_submissions_buyer_function_length;

alter table public.lead_submissions
  add constraint lead_submissions_buyer_function_length
    check (buyer_function is null or char_length(buyer_function) <= 100);

alter table public.lead_prospecting_history
  add column if not exists buyer_function text;

alter table public.workspace_security_events
  drop constraint if exists workspace_security_events_action_check;

alter table public.workspace_security_events
  add constraint workspace_security_events_action_check check (
    action in (
      'invite_sent',
      'account_activated',
      'login_succeeded',
      'login_failed',
      'logout',
      'password_reset_requested',
      'password_changed',
      'sessions_revoked',
      'account_frozen',
      'account_unfrozen',
      'lead_assigned',
      'lead_claimed',
      'lead_deletion_requested',
      'lead_deletion_approved',
      'lead_deletion_rejected'
    )
  );

create or replace function public.capture_lead_prospecting_history()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if
      new.icp_category is null and
      new.buyer_function is null and
      new.linkedin_profile_url is null and
      new.focus_name is null and
      new.focus_title is null and
      new.focus_linkedin_url is null and
      new.connection_status is null and
      new.last_outreach_date is null and
      new.next_follow_up_action is null and
      new.pain_points is null and
      new.facebook_url is null and
      new.whatsapp is null
    then
      return new;
    end if;
  elsif row(
    new.icp_category,
    new.buyer_function,
    new.linkedin_profile_url,
    new.focus_name,
    new.focus_title,
    new.focus_linkedin_url,
    new.connection_status,
    new.last_outreach_date,
    new.next_follow_up_action,
    new.pain_points,
    new.facebook_url,
    new.whatsapp
  ) is not distinct from row(
    old.icp_category,
    old.buyer_function,
    old.linkedin_profile_url,
    old.focus_name,
    old.focus_title,
    old.focus_linkedin_url,
    old.connection_status,
    old.last_outreach_date,
    old.next_follow_up_action,
    old.pain_points,
    old.facebook_url,
    old.whatsapp
  ) then
    return new;
  end if;

  insert into public.lead_prospecting_history (
    lead_id,
    capture_type,
    icp_category,
    buyer_function,
    linkedin_profile_url,
    focus_name,
    focus_title,
    focus_linkedin_url,
    connection_status,
    last_outreach_date,
    next_follow_up_action,
    pain_points,
    facebook_url,
    whatsapp
  ) values (
    new.id,
    case when tg_op = 'INSERT' then 'created' else 'updated' end,
    new.icp_category,
    new.buyer_function,
    new.linkedin_profile_url,
    new.focus_name,
    new.focus_title,
    new.focus_linkedin_url,
    new.connection_status,
    new.last_outreach_date,
    new.next_follow_up_action,
    new.pain_points,
    new.facebook_url,
    new.whatsapp
  );

  return new;
end;
$$;

drop trigger if exists capture_lead_prospecting_history
  on public.lead_submissions;
create trigger capture_lead_prospecting_history
after insert or update of
  icp_category,
  buyer_function,
  linkedin_profile_url,
  focus_name,
  focus_title,
  focus_linkedin_url,
  connection_status,
  last_outreach_date,
  next_follow_up_action,
  pain_points,
  facebook_url,
  whatsapp
on public.lead_submissions
for each row execute function public.capture_lead_prospecting_history();

create table if not exists public.lead_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.lead_submissions (id) on delete set null,
  lead_name text not null,
  lead_email text not null,
  lead_company text not null,
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  requested_by uuid references auth.users (id) on delete set null,
  requested_by_name text not null,
  requested_by_email text not null,
  reason text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_by_name text,
  reviewed_at timestamptz,
  review_note text,
  constraint lead_deletion_requests_lead_name_length
    check (char_length(trim(lead_name)) between 1 and 200),
  constraint lead_deletion_requests_email_length
    check (char_length(lead_email) between 3 and 320),
  constraint lead_deletion_requests_company_length
    check (char_length(trim(lead_company)) between 1 and 200),
  constraint lead_deletion_requests_requester_name_length
    check (char_length(trim(requested_by_name)) between 1 and 100),
  constraint lead_deletion_requests_requester_email_length
    check (char_length(requested_by_email) between 3 and 320),
  constraint lead_deletion_requests_reason_length
    check (char_length(trim(reason)) between 10 and 1000),
  constraint lead_deletion_requests_review_note_length
    check (review_note is null or char_length(review_note) <= 1000)
);

create unique index if not exists lead_deletion_requests_one_pending_per_lead
  on public.lead_deletion_requests (lead_id)
  where status = 'pending' and lead_id is not null;

create index if not exists lead_deletion_requests_status_requested_idx
  on public.lead_deletion_requests (status, requested_at desc);

alter table public.lead_deletion_requests enable row level security;
revoke all on table public.lead_deletion_requests from anon, authenticated;
grant select, insert, update on table public.lead_deletion_requests to service_role;

drop trigger if exists set_lead_deletion_request_updated_at
  on public.lead_deletion_requests;
create trigger set_lead_deletion_request_updated_at
before update on public.lead_deletion_requests
for each row execute function public.set_lead_submission_updated_at();

create or replace function public.approve_lead_deletion_request(
  p_request_id uuid,
  p_reviewer_id uuid,
  p_reviewer_name text,
  p_note text default null
)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  target_lead_id uuid;
begin
  select lead_id into target_lead_id
  from public.lead_deletion_requests
  where id = p_request_id and status = 'pending'
  for update;

  if target_lead_id is null then
    return false;
  end if;

  update public.lead_deletion_requests
  set
    status = 'approved',
    reviewed_by = p_reviewer_id,
    reviewed_by_name = p_reviewer_name,
    reviewed_at = now(),
    review_note = nullif(trim(p_note), '')
  where id = p_request_id;

  delete from public.lead_submissions where id = target_lead_id;
  return true;
end;
$$;

revoke all on function public.approve_lead_deletion_request(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.approve_lead_deletion_request(uuid, uuid, text, text)
  to service_role;

comment on column public.lead_submissions.buyer_function is
  'The internal function most likely to own the problem, evaluation, or purchase.';
comment on table public.lead_deletion_requests is
  'Auditable requests to permanently delete CRM leads; approval atomically records the decision and deletes the lead.';

commit;
