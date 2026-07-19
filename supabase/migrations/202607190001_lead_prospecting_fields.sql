alter table public.lead_submissions
  add column if not exists icp_category text,
  add column if not exists linkedin_profile_url text,
  add column if not exists focus_name text,
  add column if not exists focus_title text,
  add column if not exists focus_linkedin_url text,
  add column if not exists connection_status text,
  add column if not exists last_outreach_date date,
  add column if not exists next_follow_up_action text,
  add column if not exists pain_points text,
  add column if not exists facebook_url text,
  add column if not exists whatsapp text;

alter table public.lead_submissions
  drop constraint if exists lead_submissions_connection_status_check;

alter table public.lead_submissions
  add constraint lead_submissions_connection_status_check
  check (
    connection_status is null or connection_status in (
      'not_researched',
      'identified',
      'connection_sent',
      'connected',
      'contacted',
      'replied'
    )
  );

comment on column public.lead_submissions.linkedin_profile_url is
  'Company or account LinkedIn profile URL.';
comment on column public.lead_submissions.focus_name is
  'Senior decision-maker or influential employee selected for outreach.';
comment on column public.lead_submissions.focus_title is
  'Role or title of the selected focus contact.';
comment on column public.lead_submissions.focus_linkedin_url is
  'LinkedIn profile URL of the selected focus contact.';
comment on column public.lead_submissions.last_outreach_date is
  'Most recent date the team contacted the account or focus contact.';
comment on column public.lead_submissions.next_follow_up_action is
  'Internal sales action planned after the latest outreach; separate from funnel next_step.';
comment on column public.lead_submissions.pain_points is
  'Internal prospecting assessment; separate from the problems answer submitted by the funnel.';
