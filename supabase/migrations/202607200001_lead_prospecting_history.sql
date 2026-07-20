create table if not exists public.lead_prospecting_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.lead_submissions (id) on delete cascade,
  created_at timestamptz not null default now(),
  capture_type text not null check (capture_type in ('created', 'updated', 'backfilled')),
  icp_category text,
  linkedin_profile_url text,
  focus_name text,
  focus_title text,
  focus_linkedin_url text,
  connection_status text check (
    connection_status is null or connection_status in (
      'not_researched',
      'identified',
      'not_connected',
      'connection_sent',
      'connected',
      'contacted',
      'replied'
    )
  ),
  last_outreach_date date,
  next_follow_up_action text,
  pain_points text,
  facebook_url text,
  whatsapp text
);

create index if not exists lead_prospecting_history_lead_created_idx
  on public.lead_prospecting_history (lead_id, created_at desc);

alter table public.lead_prospecting_history enable row level security;
revoke all on table public.lead_prospecting_history from anon, authenticated;

insert into public.lead_prospecting_history (
  lead_id,
  created_at,
  capture_type,
  icp_category,
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
)
select
  lead.id,
  lead.updated_at,
  'backfilled',
  lead.icp_category,
  lead.linkedin_profile_url,
  lead.focus_name,
  lead.focus_title,
  lead.focus_linkedin_url,
  lead.connection_status,
  lead.last_outreach_date,
  lead.next_follow_up_action,
  lead.pain_points,
  lead.facebook_url,
  lead.whatsapp
from public.lead_submissions as lead
where (
  lead.icp_category is not null or
  lead.linkedin_profile_url is not null or
  lead.focus_name is not null or
  lead.focus_title is not null or
  lead.focus_linkedin_url is not null or
  lead.connection_status is not null or
  lead.last_outreach_date is not null or
  lead.next_follow_up_action is not null or
  lead.pain_points is not null or
  lead.facebook_url is not null or
  lead.whatsapp is not null
)
and not exists (
  select 1
  from public.lead_prospecting_history as history
  where history.lead_id = lead.id
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

comment on table public.lead_prospecting_history is
  'Append-only snapshots of prospecting context for auditable, paginated CRM history.';
