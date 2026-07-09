-- Luxa dashboard analytics schema hardening and deterministic demo seed.
-- Demo seed sections are clearly marked and can be removed after connecting live data.

create extension if not exists pgcrypto;

do $$
begin
  create type lead_status as enum (
    'new',
    'qualified',
    'contacted',
    'scheduled',
    'proposal_ready',
    'converted',
    'won',
    'lost',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

alter type lead_status add value if not exists 'converted';

do $$
begin
  create type submission_type as enum ('quick_start', 'full_audit');
exception
  when duplicate_object then null;
end $$;

create table if not exists leads (
  id text primary key,
  account_id text not null default 'demo-luxa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  email text not null,
  company text not null,
  website text,
  status lead_status not null default 'new',
  source text not null,
  owner_user_id text,
  last_contacted_at timestamptz,
  qualification_score integer not null default 0 check (qualification_score between 0 and 100),
  identity_metadata jsonb not null default '{}'::jsonb
);

create table if not exists audit_submissions (
  id text primary key,
  account_id text not null default 'demo-luxa',
  lead_id text not null references leads(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submission_type submission_type not null,
  source text not null,
  project_type text not null,
  industry_segment text not null,
  system_status text not null,
  problems text not null,
  improve_first text not null,
  budget_range text not null,
  timeline text not null,
  decision_stage text not null,
  preferred_next_step text not null,
  extra_context text not null default '',
  raw_payload jsonb not null default '{}'::jsonb
);

create table if not exists lead_events (
  id uuid primary key default gen_random_uuid(),
  account_id text not null default 'demo-luxa',
  lead_id text references leads(id) on delete cascade,
  created_at timestamptz not null default now(),
  event_name text not null,
  event_type text not null,
  source text not null default 'website',
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists lead_notes (
  id uuid primary key default gen_random_uuid(),
  account_id text not null default 'demo-luxa',
  lead_id text not null references leads(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text not null,
  body text not null
);

create table if not exists analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  account_id text not null default 'demo-luxa',
  snapshot_key text not null,
  date_range_key text not null check (date_range_key in ('7d', '14d', '30d', '90d')),
  captured_at timestamptz not null default now(),
  source text not null default 'supabase',
  payload jsonb not null,
  unique (snapshot_key, date_range_key, captured_at)
);

alter table leads add column if not exists account_id text not null default 'demo-luxa';
alter table audit_submissions add column if not exists account_id text not null default 'demo-luxa';
alter table audit_submissions add column if not exists updated_at timestamptz not null default now();
alter table lead_events add column if not exists account_id text not null default 'demo-luxa';
alter table lead_notes add column if not exists account_id text not null default 'demo-luxa';
alter table lead_notes add column if not exists updated_at timestamptz not null default now();
alter table analytics_snapshots add column if not exists account_id text not null default 'demo-luxa';

do $$
begin
  alter table lead_events
    add constraint lead_events_event_name_check
    check (
      event_name in (
        'page_viewed',
        'cta_clicked',
        'lead_quick_start_started',
        'lead_quick_start_submitted',
        'lead_audit_started',
        'lead_audit_step_completed',
        'lead_audit_submitted',
        'schedule_clicked',
        'email_clicked',
        'selected_work_clicked',
        'pricing_clicked',
        'dashboard_viewed',
        'lead_status_changed',
        'lead_note_added',
        'lead_exported'
      )
    );
exception
  when duplicate_object then null;
end $$;

create or replace function set_dashboard_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_set_updated_at on leads;
create trigger leads_set_updated_at
before update on leads
for each row execute function set_dashboard_updated_at();

drop trigger if exists audit_submissions_set_updated_at on audit_submissions;
create trigger audit_submissions_set_updated_at
before update on audit_submissions
for each row execute function set_dashboard_updated_at();

drop trigger if exists lead_notes_set_updated_at on lead_notes;
create trigger lead_notes_set_updated_at
before update on lead_notes
for each row execute function set_dashboard_updated_at();

create index if not exists leads_account_status_idx on leads(account_id, status);
create index if not exists leads_account_created_idx on leads(account_id, created_at desc);
create index if not exists leads_score_idx on leads(qualification_score desc);
create index if not exists audit_submissions_account_created_idx on audit_submissions(account_id, created_at desc);
create index if not exists audit_submissions_lead_created_idx on audit_submissions(lead_id, created_at desc);
create index if not exists lead_events_account_name_created_idx on lead_events(account_id, event_name, created_at desc);
create index if not exists lead_events_lead_created_idx on lead_events(lead_id, created_at desc);
create index if not exists lead_events_metadata_gin_idx on lead_events using gin(metadata);
create index if not exists lead_notes_account_lead_created_idx on lead_notes(account_id, lead_id, created_at desc);
create index if not exists analytics_snapshots_lookup_idx
  on analytics_snapshots(account_id, snapshot_key, date_range_key, captured_at desc);

alter table leads enable row level security;
alter table audit_submissions enable row level security;
alter table lead_events enable row level security;
alter table lead_notes enable row level security;
alter table analytics_snapshots enable row level security;

-- BEGIN DEMO SEED DATA. Remove this section when live production data is connected.
insert into leads (
  id,
  account_id,
  created_at,
  updated_at,
  name,
  email,
  company,
  website,
  status,
  source,
  owner_user_id,
  last_contacted_at,
  qualification_score,
  identity_metadata
) values
  ('lead-stratus', 'demo-luxa', '2026-07-08 08:15+00', '2026-07-08 09:05+00', 'Elena Foster', 'elena@stratusworks.co', 'Stratus Works', 'https://stratusworks.co', 'qualified', 'home_hero_form', 'owner-ava', null, 92, '{"company_size":"51-200","country":"US","utm_campaign":"ops-scale"}'),
  ('lead-camden', 'demo-luxa', '2026-07-01 10:30+00', '2026-07-07 14:10+00', 'Marcus Hale', 'marcus@camdenrisk.com', 'Camden Risk', 'https://camdenrisk.com', 'won', 'audit_success', 'owner-ines', '2026-07-07 14:10+00', 95, '{"company_size":"201-500","country":"UK","utm_campaign":"risk-operations"}'),
  ('lead-bluewater', 'demo-luxa', '2026-06-24 16:40+00', '2026-07-05 12:00+00', 'Sofia Mendes', 'sofia@bluewaterlogistics.com', 'Bluewater Logistics', 'https://bluewaterlogistics.com', 'scheduled', 'logistics_page', 'owner-malik', '2026-07-05 12:00+00', 87, '{"company_size":"201-500","country":"US","utm_campaign":"logistics-automation"}'),
  ('lead-arden', 'demo-luxa', '2026-06-12 11:05+00', '2026-06-18 09:45+00', 'Theo Walsh', 'theo@ardenclinic.com', 'Arden Clinic Group', 'https://ardenclinic.com', 'contacted', 'book_call_page', 'owner-ava', '2026-06-18 09:45+00', 76, '{"company_size":"51-200","country":"CA","utm_campaign":"clinic-ops"}')
on conflict (id) do update set
  account_id = excluded.account_id,
  updated_at = excluded.updated_at,
  status = excluded.status,
  owner_user_id = excluded.owner_user_id,
  last_contacted_at = excluded.last_contacted_at,
  qualification_score = excluded.qualification_score,
  identity_metadata = excluded.identity_metadata;

insert into audit_submissions (
  id,
  account_id,
  lead_id,
  created_at,
  updated_at,
  submission_type,
  source,
  project_type,
  industry_segment,
  system_status,
  problems,
  improve_first,
  budget_range,
  timeline,
  decision_stage,
  preferred_next_step,
  extra_context,
  raw_payload
) values
  ('audit-stratus-full', 'demo-luxa', 'lead-stratus', '2026-07-08 08:18+00', '2026-07-08 08:18+00', 'full_audit', 'home_hero_form', 'Revenue operations command center', 'B2B services', 'Sales, delivery, and finance operate from separate queues', 'Qualified demand is delayed by manual routing and duplicated status updates.', 'Unify intake, lead scoring, and handoff reporting.', '$75k to $120k', '30 to 60 days', 'Founder approved scope', 'Private working session', 'Board review is scheduled for August.', '{"submission_version":"v2","demo_seed":true}'),
  ('audit-camden-full', 'demo-luxa', 'lead-camden', '2026-07-01 10:36+00', '2026-07-01 10:36+00', 'full_audit', 'audit_success', 'Risk workflow automation', 'Financial services', 'Risk review is coordinated through email and spreadsheets', 'No single view of approvals, blockers, and audit history.', 'Model approval states and exception queues.', '$120k+', '60 to 90 days', 'Executive sponsor aligned', 'Proposal review', 'Converted lead validates enterprise cohort quality.', '{"submission_version":"v2","demo_seed":true}'),
  ('audit-bluewater-full', 'demo-luxa', 'lead-bluewater', '2026-06-24 16:45+00', '2026-06-24 16:45+00', 'full_audit', 'logistics_page', 'Fleet dispatch visibility', 'Logistics', 'Dispatchers rely on calls and static sheets', 'Customers and account teams lack live exception visibility.', 'Start with dispatch status model and customer notifications.', '$75k to $120k', '60 to 90 days', 'Budget approved', 'Discovery call', '', '{"submission_version":"v2","demo_seed":true}'),
  ('audit-arden-quick', 'demo-luxa', 'lead-arden', '2026-06-12 11:09+00', '2026-06-12 11:09+00', 'quick_start', 'book_call_page', 'Patient intake routing', 'Healthcare', 'Manual intake triage before scheduling', 'Staff cannot prioritize high-fit requests quickly.', 'Automate triage rules and status visibility.', '$45k to $75k', '90 days+', 'Department lead evaluating', 'Email follow-up', '', '{"submission_version":"quick","demo_seed":true}')
on conflict (id) do nothing;

insert into lead_notes (account_id, lead_id, created_at, updated_at, created_by, body) values
  ('demo-luxa', 'lead-stratus', '2026-07-08 09:05+00', '2026-07-08 09:05+00', 'Ava Sinclair', 'High-fit operations lead. Prepare discovery around intake routing and executive reporting.'),
  ('demo-luxa', 'lead-camden', '2026-07-07 14:10+00', '2026-07-07 14:10+00', 'Ines Parker', 'Converted from audit success path. Keep risk approval workflow as proof point.'),
  ('demo-luxa', 'lead-bluewater', '2026-07-05 12:00+00', '2026-07-05 12:00+00', 'Malik West', 'Discovery booked. Confirm dispatch data sources before the call.')
on conflict do nothing;

with days as (
  select
    day::date as event_day,
    row_number() over (order by day)::integer as day_index
  from generate_series('2026-04-10'::date, '2026-07-08'::date, interval '1 day') as day
),
seeded_events as (
  select
    'demo-luxa'::text as account_id,
    null::text as lead_id,
    (event_day + time '09:00' + ((event_index % 11) * interval '23 minutes'))::timestamptz as created_at,
    'page_viewed'::text as event_name,
    'page_viewed'::text as event_type,
    'website'::text as source,
    jsonb_build_object(
      'path', (array['/', '/services', '/selected-work', '/pricing', '/book-call'])[((event_index + day_index) % 5) + 1],
      'referrer', (array['direct', 'linkedin', 'google', 'partner'])[((event_index + day_index) % 4) + 1],
      'campaign', (array['ops-scale', 'risk-operations', 'clinic-ops', 'logistics-automation'])[((event_index + day_index) % 4) + 1],
      'device_type', (array['desktop', 'mobile', 'tablet'])[((event_index + day_index) % 3) + 1],
      'anonymous_session_id', 'demo-session-' || day_index || '-' || event_index,
      'timestamp', (event_day + time '09:00')::text,
      'seed_batch', 'dashboard-analytics-20260708'
    ) as metadata
  from days
  cross join lateral generate_series(1, 26 + (day_index % 17)) as event_index
  union all
  select
    'demo-luxa',
    null,
    (event_day + time '12:00' + ((event_index % 7) * interval '41 minutes'))::timestamptz,
    case
      when event_index % 6 = 0 then 'lead_audit_submitted'
      when event_index % 4 = 0 then 'schedule_clicked'
      when event_index % 3 = 0 then 'lead_quick_start_submitted'
      else 'cta_clicked'
    end,
    case
      when event_index % 6 = 0 then 'lead_audit_submitted'
      when event_index % 4 = 0 then 'schedule_clicked'
      when event_index % 3 = 0 then 'lead_quick_start_submitted'
      else 'cta_clicked'
    end,
    (array['home_hero_form', 'navbar_audit', 'selected_work_card', 'pricing_page', 'book_call_page'])[((event_index + day_index) % 5) + 1],
    jsonb_build_object(
      'source', (array['home_hero_form', 'navbar_audit', 'selected_work_card', 'pricing_page', 'book_call_page'])[((event_index + day_index) % 5) + 1],
      'campaign', (array['ops-scale', 'risk-operations', 'clinic-ops', 'logistics-automation'])[((event_index + day_index) % 4) + 1],
      'project_id', (array['revenue-ops', 'risk-workflow', 'patient-intake', 'fleet-dispatch'])[((event_index + day_index) % 4) + 1],
      'funnel_id', 'primary-audit',
      'device_type', (array['desktop', 'mobile', 'tablet'])[((event_index + day_index) % 3) + 1],
      'timestamp', (event_day + time '12:00')::text,
      'seed_batch', 'dashboard-analytics-20260708'
    )
  from days
  cross join lateral generate_series(1, 4 + (day_index % 5)) as event_index
)
insert into lead_events (account_id, lead_id, created_at, event_name, event_type, source, metadata)
select account_id, lead_id, created_at, event_name, event_type, source, metadata
from seeded_events
where not exists (
  select 1 from lead_events where metadata ->> 'seed_batch' = 'dashboard-analytics-20260708'
);

with snapshot_ranges as (
  select * from (values
    ('7d', 2840, 416, 74, 29, 18, 12),
    ('14d', 5120, 761, 136, 51, 34, 21),
    ('30d', 10840, 1588, 276, 103, 68, 42),
    ('90d', 31890, 4532, 806, 291, 188, 116)
  ) as range_values(date_range_key, visitors, cta_clicks, quick_starts, full_audits, schedule_clicks, email_clicks)
)
insert into analytics_snapshots (account_id, snapshot_key, date_range_key, captured_at, source, payload)
select
  'demo-luxa',
  'analytics_overview',
  date_range_key,
  '2026-07-08 10:00+00'::timestamptz,
  'supabase',
  jsonb_build_object(
    'dateRange', jsonb_build_object('key', date_range_key, 'label', 'Last ' || replace(date_range_key, 'd', ' days'), 'from', '2026-04-10T00:00:00.000Z', 'to', '2026-07-08T10:00:00.000Z'),
    'metrics', jsonb_build_array(
      jsonb_build_object('key', 'visitors', 'label', 'Visitors', 'value', visitors, 'trend', '+9%', 'trendDirection', 'up', 'note', 'Unique visitors'),
      jsonb_build_object('key', 'cta_clicks', 'label', 'CTA clicks', 'value', cta_clicks, 'trend', '+13%', 'trendDirection', 'up', 'note', 'Allowed metadata only'),
      jsonb_build_object('key', 'quick_start_submissions', 'label', 'Quick-start submissions', 'value', quick_starts, 'trend', '+8%', 'trendDirection', 'up', 'note', 'Short-form intent'),
      jsonb_build_object('key', 'full_audit_submissions', 'label', 'Full audit submissions', 'value', full_audits, 'trend', '+24%', 'trendDirection', 'up', 'note', 'High-intent conversions'),
      jsonb_build_object('key', 'schedule_clicks', 'label', 'Schedule clicks', 'value', schedule_clicks, 'trend', '+11%', 'trendDirection', 'up', 'note', 'Booked-intent clicks'),
      jsonb_build_object('key', 'email_clicks', 'label', 'Email clicks', 'value', email_clicks, 'trend', '+5%', 'trendDirection', 'up', 'note', 'Direct reply intent')
    ),
    'funnel', jsonb_build_array(
      jsonb_build_object('key', 'visitors', 'label', 'Visitors', 'value', visitors, 'rate', 100, 'delta', '+9%'),
      jsonb_build_object('key', 'cta_clicks', 'label', 'CTA clicks', 'value', cta_clicks, 'rate', 14.6, 'delta', '+13%'),
      jsonb_build_object('key', 'quick_start_submitted', 'label', 'Quick-start submitted', 'value', quick_starts, 'rate', 17.8, 'delta', '+8%'),
      jsonb_build_object('key', 'audit_submitted', 'label', 'Audit submitted', 'value', full_audits, 'rate', 56.9, 'delta', '+24%'),
      jsonb_build_object('key', 'schedule_clicked', 'label', 'Schedule clicked', 'value', schedule_clicks, 'rate', 62.1, 'delta', '+11%')
    ),
    'dailyVisitors', jsonb_build_array(
      jsonb_build_object('key', 'jul-02', 'label', 'Jul 2', 'value', round(visitors * 0.12), 'context', 'Unique visitors'),
      jsonb_build_object('key', 'jul-03', 'label', 'Jul 3', 'value', round(visitors * 0.13), 'context', 'Unique visitors'),
      jsonb_build_object('key', 'jul-04', 'label', 'Jul 4', 'value', round(visitors * 0.14), 'context', 'Unique visitors'),
      jsonb_build_object('key', 'jul-05', 'label', 'Jul 5', 'value', round(visitors * 0.13), 'context', 'Unique visitors'),
      jsonb_build_object('key', 'jul-06', 'label', 'Jul 6', 'value', round(visitors * 0.16), 'context', 'Unique visitors'),
      jsonb_build_object('key', 'jul-07', 'label', 'Jul 7', 'value', round(visitors * 0.16), 'context', 'Unique visitors'),
      jsonb_build_object('key', 'jul-08', 'label', 'Jul 8', 'value', round(visitors * 0.16), 'context', 'Unique visitors')
    ),
    'dailySubmissions', jsonb_build_array(
      jsonb_build_object('key', 'jul-02', 'label', 'Jul 2', 'value', round((quick_starts + full_audits) * 0.11), 'context', 'Lead submissions'),
      jsonb_build_object('key', 'jul-03', 'label', 'Jul 3', 'value', round((quick_starts + full_audits) * 0.12), 'context', 'Lead submissions'),
      jsonb_build_object('key', 'jul-04', 'label', 'Jul 4', 'value', round((quick_starts + full_audits) * 0.13), 'context', 'Lead submissions'),
      jsonb_build_object('key', 'jul-05', 'label', 'Jul 5', 'value', round((quick_starts + full_audits) * 0.14), 'context', 'Lead submissions'),
      jsonb_build_object('key', 'jul-06', 'label', 'Jul 6', 'value', round((quick_starts + full_audits) * 0.16), 'context', 'Lead submissions'),
      jsonb_build_object('key', 'jul-07', 'label', 'Jul 7', 'value', round((quick_starts + full_audits) * 0.17), 'context', 'Lead submissions'),
      jsonb_build_object('key', 'jul-08', 'label', 'Jul 8', 'value', round((quick_starts + full_audits) * 0.17), 'context', 'Lead submissions')
    ),
    'dailyScheduleClicks', jsonb_build_array(
      jsonb_build_object('key', 'jul-02', 'label', 'Jul 2', 'value', 2, 'context', 'Schedule clicks'),
      jsonb_build_object('key', 'jul-03', 'label', 'Jul 3', 'value', 3, 'context', 'Schedule clicks'),
      jsonb_build_object('key', 'jul-04', 'label', 'Jul 4', 'value', 2, 'context', 'Schedule clicks'),
      jsonb_build_object('key', 'jul-05', 'label', 'Jul 5', 'value', 4, 'context', 'Schedule clicks'),
      jsonb_build_object('key', 'jul-06', 'label', 'Jul 6', 'value', 3, 'context', 'Schedule clicks'),
      jsonb_build_object('key', 'jul-07', 'label', 'Jul 7', 'value', 4, 'context', 'Schedule clicks'),
      jsonb_build_object('key', 'jul-08', 'label', 'Jul 8', 'value', 3, 'context', 'Schedule clicks')
    ),
    'dailyConversionRate', jsonb_build_array(
      jsonb_build_object('key', 'jul-02', 'label', 'Jul 2', 'value', 3.1, 'context', 'Visitor to lead'),
      jsonb_build_object('key', 'jul-03', 'label', 'Jul 3', 'value', 3.4, 'context', 'Visitor to lead'),
      jsonb_build_object('key', 'jul-04', 'label', 'Jul 4', 'value', 3.2, 'context', 'Visitor to lead'),
      jsonb_build_object('key', 'jul-05', 'label', 'Jul 5', 'value', 3.9, 'context', 'Visitor to lead'),
      jsonb_build_object('key', 'jul-06', 'label', 'Jul 6', 'value', 4.1, 'context', 'Visitor to lead'),
      jsonb_build_object('key', 'jul-07', 'label', 'Jul 7', 'value', 4.2, 'context', 'Visitor to lead'),
      jsonb_build_object('key', 'jul-08', 'label', 'Jul 8', 'value', 4.0, 'context', 'Visitor to lead')
    ),
    'ctaClicksBySource', jsonb_build_array(
      jsonb_build_object('key', 'home_hero_form', 'label', 'Home hero', 'value', round(cta_clicks * 0.28), 'context', 'CTA clicks'),
      jsonb_build_object('key', 'navbar_audit', 'label', 'Navbar audit', 'value', round(cta_clicks * 0.21), 'context', 'CTA clicks'),
      jsonb_build_object('key', 'selected_work_card', 'label', 'Selected work', 'value', round(cta_clicks * 0.18), 'context', 'CTA clicks'),
      jsonb_build_object('key', 'pricing_page', 'label', 'Pricing page', 'value', round(cta_clicks * 0.14), 'context', 'CTA clicks')
    ),
    'submissionsByProjectType', jsonb_build_array(
      jsonb_build_object('key', 'revenue_ops', 'label', 'Revenue ops', 'value', 32, 'context', 'Submissions'),
      jsonb_build_object('key', 'risk_workflow', 'label', 'Risk workflow', 'value', 25, 'context', 'Submissions'),
      jsonb_build_object('key', 'fleet_dispatch', 'label', 'Fleet dispatch', 'value', 19, 'context', 'Submissions')
    ),
    'submissionsByIndustry', jsonb_build_array(
      jsonb_build_object('key', 'b2b_services', 'label', 'B2B services', 'value', 28, 'context', 'Submissions'),
      jsonb_build_object('key', 'financial_services', 'label', 'Financial services', 'value', 21, 'context', 'Submissions'),
      jsonb_build_object('key', 'logistics', 'label', 'Logistics', 'value', 14, 'context', 'Submissions')
    ),
    'submissionsByBudget', jsonb_build_array(
      jsonb_build_object('key', '45_75', 'label', '$45k to $75k', 'value', 27, 'context', 'Submissions'),
      jsonb_build_object('key', '75_120', 'label', '$75k to $120k', 'value', 20, 'context', 'Submissions'),
      jsonb_build_object('key', '120_plus', 'label', '$120k+', 'value', 7, 'context', 'Submissions')
    ),
    'submissionsByTimeline', jsonb_build_array(
      jsonb_build_object('key', '30_60', 'label', '30 to 60 days', 'value', 39, 'context', 'Submissions'),
      jsonb_build_object('key', '60_90', 'label', '60 to 90 days', 'value', 28, 'context', 'Submissions'),
      jsonb_build_object('key', '90_plus', 'label', '90 days+', 'value', 12, 'context', 'Submissions')
    ),
    'topLandingPages', jsonb_build_array(
      jsonb_build_object('key', '/', 'label', 'Home', 'value', round(visitors * 0.33), 'context', 'Visitors'),
      jsonb_build_object('key', '/selected-work', 'label', 'Selected work', 'value', round(visitors * 0.18), 'context', 'Visitors'),
      jsonb_build_object('key', '/services', 'label', 'Services', 'value', round(visitors * 0.17), 'context', 'Visitors'),
      jsonb_build_object('key', '/pricing', 'label', 'Pricing', 'value', round(visitors * 0.12), 'context', 'Visitors')
    ),
    'topReferrers', jsonb_build_array(
      jsonb_build_object('key', 'linkedin', 'label', 'LinkedIn', 'value', 214, 'context', 'Visitors'),
      jsonb_build_object('key', 'direct', 'label', 'Direct', 'value', 188, 'context', 'Visitors'),
      jsonb_build_object('key', 'google', 'label', 'Google', 'value', 162, 'context', 'Visitors')
    ),
    'utmCampaignPerformance', jsonb_build_array(
      jsonb_build_object('key', 'ops-scale', 'label', 'ops-scale', 'value', 93, 'context', 'Submissions'),
      jsonb_build_object('key', 'risk-operations', 'label', 'risk-operations', 'value', 42, 'context', 'Submissions'),
      jsonb_build_object('key', 'logistics-automation', 'label', 'logistics-automation', 'value', 26, 'context', 'Submissions')
    ),
    'source', 'supabase'
  )
from snapshot_ranges
where not exists (
  select 1
  from analytics_snapshots
  where account_id = 'demo-luxa'
    and snapshot_key = 'analytics_overview'
    and date_range_key = snapshot_ranges.date_range_key
    and captured_at = '2026-07-08 10:00+00'::timestamptz
);
-- END DEMO SEED DATA.
