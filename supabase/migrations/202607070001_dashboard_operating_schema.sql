-- Luxa dashboard operating schema and seed data.
-- Apply in Supabase SQL editor or through the Supabase CLI.

create extension if not exists pgcrypto;

do $$
begin
  create type lead_status as enum (
    'new',
    'qualified',
    'contacted',
    'scheduled',
    'proposal_ready',
    'won',
    'lost',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type submission_type as enum ('quick_start', 'full_audit');
exception
  when duplicate_object then null;
end $$;

create table if not exists leads (
  id text primary key,
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
  lead_id text not null references leads(id) on delete cascade,
  created_at timestamptz not null default now(),
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
  lead_id text references leads(id) on delete cascade,
  created_at timestamptz not null default now(),
  event_name text not null,
  event_type text not null,
  source text not null default 'website',
  metadata jsonb not null default '{}'::jsonb,
  constraint lead_events_event_name_check check (
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
  )
);

create table if not exists lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id text not null references leads(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by text not null,
  body text not null
);

create table if not exists analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_key text not null,
  date_range_key text not null check (date_range_key in ('7d', '14d', '30d', '90d')),
  captured_at timestamptz not null default now(),
  source text not null default 'supabase',
  payload jsonb not null,
  unique (snapshot_key, date_range_key, captured_at)
);

create index if not exists leads_status_idx on leads(status);
create index if not exists leads_score_idx on leads(qualification_score desc);
create index if not exists audit_submissions_lead_created_idx on audit_submissions(lead_id, created_at desc);
create index if not exists audit_submissions_project_idx on audit_submissions(project_type);
create index if not exists lead_events_name_created_idx on lead_events(event_name, created_at desc);
create index if not exists lead_events_lead_created_idx on lead_events(lead_id, created_at desc);
create index if not exists lead_notes_lead_created_idx on lead_notes(lead_id, created_at desc);
create index if not exists analytics_snapshots_lookup_idx
  on analytics_snapshots(snapshot_key, date_range_key, captured_at desc);

alter table leads enable row level security;
alter table audit_submissions enable row level security;
alter table lead_events enable row level security;
alter table lead_notes enable row level security;
alter table analytics_snapshots enable row level security;

insert into leads (
  id,
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
  ('lead-northstar', '2026-07-07 07:18+00', '2026-07-07 09:28+00', 'Maya Chen', 'maya.chen@northstarops.co', 'Northstar Ops', 'https://northstarops.co', 'qualified', 'home_hero_form', 'owner-ava', null, 94, '{"country":"US","company_size":"51-200","utm_campaign":"ops-scale"}'),
  ('lead-aurora', '2026-07-06 15:42+00', '2026-07-07 08:05+00', 'Ethan Rhodes', 'ethan@auroraledger.com', 'Aurora Ledger', 'https://auroraledger.com', 'scheduled', 'navbar_audit', 'owner-ines', '2026-07-06 17:02+00', 88, '{"country":"UK","company_size":"11-50","utm_campaign":"finance-systems"}'),
  ('lead-halo', '2026-07-05 10:14+00', '2026-07-05 10:14+00', 'Priya Raman', 'priya@halomaterials.com', 'Halo Materials', 'https://halomaterials.com', 'new', 'selected_work_card', null, null, 79, '{"country":"US","company_size":"201-500","utm_campaign":"manufacturing"}'),
  ('lead-meridian', '2026-07-04 08:20+00', '2026-07-06 12:40+00', 'Jon Bell', 'jon@meridianclinicgroup.com', 'Meridian Clinic Group', 'https://meridianclinicgroup.com', 'contacted', 'book_call_page', 'owner-malik', '2026-07-04 12:24+00', 72, '{"country":"US","company_size":"51-200","utm_campaign":"clinic-ops"}'),
  ('lead-sable', '2026-07-03 19:12+00', '2026-07-06 16:11+00', 'Lina Ortega', 'lina@sableatelier.com', 'Sable Atelier', 'https://sableatelier.com', 'proposal_ready', 'audit_success', 'owner-ava', '2026-07-06 15:45+00', 91, '{"country":"ES","company_size":"11-50","utm_campaign":"commerce-automation"}'),
  ('lead-civic', '2026-07-02 11:32+00', '2026-07-02 11:32+00', 'Noah Grant', 'noah@civicforge.io', 'Civic Forge', 'https://civicforge.io', 'qualified', 'pricing_page', null, null, 84, '{"country":"US","company_size":"11-50","utm_campaign":"pricing-intent"}'),
  ('lead-peakline', '2026-06-30 14:05+00', '2026-07-05 09:20+00', 'Sara McNeil', 'sara@peaklinecapital.co', 'Peakline Capital', 'https://peaklinecapital.co', 'won', 'solution_page', 'owner-ines', '2026-07-05 09:20+00', 96, '{"country":"CA","company_size":"51-200","utm_campaign":"capital-ops"}'),
  ('lead-lattice', '2026-06-29 13:46+00', '2026-07-02 16:30+00', 'Ben Okafor', 'ben@latticehire.com', 'Lattice Hire', 'https://latticehire.com', 'lost', 'industry_page', 'owner-malik', '2026-07-01 10:10+00', 63, '{"country":"NG","company_size":"11-50","utm_campaign":"talent-systems"}'),
  ('lead-verdant', '2026-06-27 16:08+00', '2026-07-01 13:18+00', 'Nora Silva', 'nora@verdantsupply.com', 'Verdant Supply', 'https://verdantsupply.com', 'archived', 'footer_audit', 'owner-ava', '2026-06-28 09:41+00', 41, '{"country":"BR","company_size":"1-10","utm_campaign":"legacy"}'),
  ('lead-copperline', '2026-07-01 09:15+00', '2026-07-06 10:30+00', 'Amelia Stone', 'amelia@copperline.studio', 'Copperline Studio', 'https://copperline.studio', 'contacted', 'case_study_cta', 'owner-ines', '2026-07-02 14:00+00', 82, '{"country":"US","company_size":"1-10","utm_campaign":"creative-ops"}'),
  ('lead-harbor', '2026-06-25 12:05+00', '2026-07-03 15:10+00', 'Owen Price', 'owen@harborfleet.com', 'Harbor Fleet', 'https://harborfleet.com', 'scheduled', 'logistics_page', 'owner-malik', '2026-07-03 15:10+00', 86, '{"country":"US","company_size":"201-500","utm_campaign":"logistics-automation"}'),
  ('lead-mono', '2026-06-21 18:44+00', '2026-07-01 08:00+00', 'Rae Kim', 'rae@monocare.health', 'MonoCare Health', 'https://monocare.health', 'new', 'newsletter_cta', null, null, 68, '{"country":"KR","company_size":"51-200","utm_campaign":"healthcare-intake"}')
on conflict (id) do update set
  updated_at = excluded.updated_at,
  status = excluded.status,
  owner_user_id = excluded.owner_user_id,
  last_contacted_at = excluded.last_contacted_at,
  qualification_score = excluded.qualification_score,
  identity_metadata = excluded.identity_metadata;

insert into audit_submissions (
  id,
  lead_id,
  created_at,
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
  ('audit-northstar-full', 'lead-northstar', '2026-07-07 07:21+00', 'full_audit', 'home_hero_form', 'Revenue operations system', 'B2B services', 'Manual handoffs across sales, delivery, and finance', 'Lead qualification lives in spreadsheets and is copied into multiple tools.', 'Centralize intake, scoring, and handoff logic.', '$45k to $75k', '30 to 60 days', 'Founder approved scope', 'Private working session', 'Partner channel launches in August.', '{"submission_version":"v1","steps_completed":6}'),
  ('audit-aurora-full', 'lead-aurora', '2026-07-06 15:47+00', 'full_audit', 'navbar_audit', 'Finance workflow automation', 'Fintech', 'Back-office approvals are split across email, Slack, and ledgers', 'Approvals lack visibility and audit history.', 'Map approval states before dashboarding.', '$75k to $120k', '60 to 90 days', 'Executive sponsor aligned', 'Discovery call', 'Compliance team must review data boundaries.', '{"submission_version":"v1","steps_completed":6}'),
  ('audit-halo-quick', 'lead-halo', '2026-07-05 10:16+00', 'quick_start', 'selected_work_card', 'Manufacturing portal', 'Industrial supply', 'Customer requests arrive through account managers', 'No shared queue for production questions.', 'Start with a customer-facing request portal.', '$25k to $45k', '30 days', 'Researching options', 'Email follow-up', '', '{"submission_version":"quick","steps_completed":2}'),
  ('audit-meridian-full', 'lead-meridian', '2026-07-04 08:24+00', 'full_audit', 'book_call_page', 'Patient intake automation', 'Healthcare', 'Manual intake and appointment triage', 'Staff rekey patient context into scheduling tools.', 'Automate intake classification and handoff.', '$45k to $75k', '30 to 60 days', 'Department lead evaluating', 'Discovery call', 'HIPAA-safe implementation path required.', '{"submission_version":"v1","steps_completed":6}'),
  ('audit-sable-full', 'lead-sable', '2026-07-03 19:16+00', 'full_audit', 'audit_success', 'Commerce operations hub', 'Retail and ecommerce', 'Inventory, customer service, and fulfillment tools do not agree', 'Teams cannot see delayed orders early enough.', 'Unify exception reporting before replacing systems.', '$75k to $120k', '30 to 60 days', 'Founder approved scope', 'Proposal review', '', '{"submission_version":"v1","steps_completed":6}'),
  ('audit-civic-quick', 'lead-civic', '2026-07-02 11:35+00', 'quick_start', 'pricing_page', 'Grant management CRM', 'Public sector', 'Funding pipeline is tracked in spreadsheets', 'Compliance dates and stakeholder follow-ups are easy to miss.', 'Build the grant pipeline and reminder workflow first.', '$25k to $45k', '60 to 90 days', 'Budget approved', 'Private working session', '', '{"submission_version":"quick","steps_completed":2}'),
  ('audit-peakline-full', 'lead-peakline', '2026-06-30 14:11+00', 'full_audit', 'solution_page', 'Investor reporting system', 'Financial services', 'Portfolio updates are manually consolidated', 'Quarterly reporting takes weeks.', 'Create source-of-truth reporting tables and approval flow.', '$120k+', '90 days+', 'Executive sponsor aligned', 'Proposal review', 'Won seed proves high-budget cohort metrics.', '{"submission_version":"v1","steps_completed":6}'),
  ('audit-copperline-quick', 'lead-copperline', '2026-07-01 09:21+00', 'quick_start', 'case_study_cta', 'Creative studio workflow', 'Professional services', 'Project status is scattered across docs and messages', 'Clients ask for updates that producers already sent elsewhere.', 'Consolidate project timeline and client comms.', '$10k to $25k', '30 days', 'Researching options', 'Email follow-up', '', '{"submission_version":"quick","steps_completed":2}'),
  ('audit-harbor-full', 'lead-harbor', '2026-06-25 12:11+00', 'full_audit', 'logistics_page', 'Fleet dispatch system', 'Logistics', 'Dispatch relies on spreadsheets and phone calls', 'Drivers and clients lack live status updates.', 'Model dispatch states and customer notifications.', '$75k to $120k', '60 to 90 days', 'Budget approved', 'Discovery call', '', '{"submission_version":"v1","steps_completed":6}'),
  ('audit-mono-quick', 'lead-mono', '2026-06-21 18:50+00', 'quick_start', 'newsletter_cta', 'Care coordination intake', 'Healthcare', 'Referral intake is manual', 'Care coordinators cannot prioritize referrals.', 'Score referral urgency and route to care teams.', '$25k to $45k', '90 days+', 'Researching options', 'Email follow-up', '', '{"submission_version":"quick","steps_completed":2}')
on conflict (id) do nothing;

insert into lead_events (lead_id, created_at, event_name, event_type, source, metadata) values
  ('lead-northstar', '2026-07-07 07:18+00', 'cta_clicked', 'cta_clicked', 'home_hero_form', '{"route":"/","cta_label":"Audit my funnel","project_type":"Revenue operations system","utm_campaign":"ops-scale"}'),
  ('lead-northstar', '2026-07-07 07:21+00', 'lead_audit_submitted', 'lead_audit_submitted', 'home_hero_form', '{"submission_type":"full_audit","budget_range":"$45k to $75k","timeline":"30 to 60 days"}'),
  ('lead-aurora', '2026-07-06 15:42+00', 'cta_clicked', 'cta_clicked', 'navbar_audit', '{"route":"/services","cta_label":"Start audit","utm_campaign":"finance-systems"}'),
  ('lead-aurora', '2026-07-06 15:47+00', 'lead_audit_submitted', 'lead_audit_submitted', 'navbar_audit', '{"submission_type":"full_audit","budget_range":"$75k to $120k","industry_segment":"Fintech"}'),
  ('lead-halo', '2026-07-05 10:16+00', 'lead_quick_start_submitted', 'lead_quick_start_submitted', 'selected_work_card', '{"submission_type":"quick_start","project_type":"Manufacturing portal","budget_range":"$25k to $45k"}'),
  ('lead-meridian', '2026-07-04 08:20+00', 'schedule_clicked', 'schedule_clicked', 'book_call_page', '{"route":"/book-call","source":"book_call_page"}'),
  ('lead-sable', '2026-07-03 19:16+00', 'lead_audit_submitted', 'lead_audit_submitted', 'audit_success', '{"submission_type":"full_audit","industry_segment":"Retail and ecommerce","timeline":"30 to 60 days"}'),
  ('lead-civic', '2026-07-02 11:32+00', 'pricing_clicked', 'pricing_clicked', 'pricing_page', '{"route":"/pricing","budget_range":"$25k to $45k"}'),
  ('lead-peakline', '2026-06-30 14:05+00', 'lead_status_changed', 'lead_status_changed', 'dashboard', '{"lead_id":"lead-peakline","status":"won"}'),
  ('lead-copperline', '2026-07-01 09:21+00', 'lead_quick_start_submitted', 'lead_quick_start_submitted', 'case_study_cta', '{"submission_type":"quick_start","project_type":"Creative studio workflow","budget_range":"$10k to $25k"}'),
  ('lead-harbor', '2026-06-25 12:11+00', 'lead_audit_submitted', 'lead_audit_submitted', 'logistics_page', '{"submission_type":"full_audit","industry_segment":"Logistics","budget_range":"$75k to $120k"}'),
  (null, '2026-07-07 06:00+00', 'page_viewed', 'page_viewed', 'website', '{"route":"/selected-work","utm_source":"linkedin","utm_medium":"paid","utm_campaign":"ops-scale"}'),
  (null, '2026-07-06 12:00+00', 'selected_work_clicked', 'selected_work_clicked', 'website', '{"route":"/selected-work","source":"case_study_card"}')
on conflict do nothing;

with seed_days as (
  select
    day::date as event_day,
    row_number() over (order by day)::integer as day_index
  from generate_series('2026-06-08'::date, '2026-07-07'::date, interval '1 day') as day
),
page_events as (
  select
    null::text as lead_id,
    (event_day + time '09:00' + ((event_index % 9) * interval '31 minutes'))::timestamptz as created_at,
    'page_viewed'::text as event_name,
    'page_viewed'::text as event_type,
    'website'::text as source,
    jsonb_build_object(
      'route',
      (array['/', '/services', '/selected-work', '/pricing', '/book-call'])[
        ((event_index + day_index) % 5) + 1
      ],
      'utm_source',
      (array['direct', 'linkedin', 'google', 'partner'])[
        ((event_index + day_index) % 4) + 1
      ],
      'utm_medium',
      (array['organic', 'paid', 'referral'])[
        ((event_index + day_index) % 3) + 1
      ],
      'utm_campaign',
      (array['ops-scale', 'finance-systems', 'clinic-ops', 'logistics-automation'])[
        ((event_index + day_index) % 4) + 1
      ],
      'seed_batch',
      'deterministic-20260707'
    ) as metadata
  from seed_days
  cross join lateral generate_series(1, 36 + (day_index % 13)) as event_index
),
cta_events as (
  select
    null::text as lead_id,
    (event_day + time '10:15' + ((event_index % 8) * interval '43 minutes'))::timestamptz as created_at,
    'cta_clicked'::text as event_name,
    'cta_clicked'::text as event_type,
    (array['home_hero_form', 'navbar_audit', 'selected_work_card', 'pricing_page', 'book_call_page'])[
      ((event_index + day_index) % 5) + 1
    ] as source,
    jsonb_build_object(
      'route',
      (array['/', '/services', '/selected-work', '/pricing', '/book-call'])[
        ((event_index + day_index) % 5) + 1
      ],
      'cta_label',
      (array['Start audit', 'Book discovery', 'Review systems', 'Export lead context'])[
        ((event_index + day_index) % 4) + 1
      ],
      'seed_batch',
      'deterministic-20260707'
    ) as metadata
  from seed_days
  cross join lateral generate_series(1, 5 + (day_index % 5)) as event_index
),
conversion_events as (
  select
    null::text as lead_id,
    (event_day + time '13:00' + ((event_index % 5) * interval '67 minutes'))::timestamptz as created_at,
    case
      when event_index % 5 = 0 then 'lead_audit_submitted'
      when event_index % 3 = 0 then 'schedule_clicked'
      else 'lead_quick_start_submitted'
    end as event_name,
    case
      when event_index % 5 = 0 then 'lead_audit_submitted'
      when event_index % 3 = 0 then 'schedule_clicked'
      else 'lead_quick_start_submitted'
    end as event_type,
    (array['home_hero_form', 'navbar_audit', 'selected_work_card', 'pricing_page', 'book_call_page'])[
      ((event_index + day_index) % 5) + 1
    ] as source,
    jsonb_build_object(
      'submission_type',
      case when event_index % 5 = 0 then 'full_audit' else 'quick_start' end,
      'project_type',
      (array['Revenue operations system', 'Finance workflow automation', 'Patient intake automation', 'Fleet dispatch system'])[
        ((event_index + day_index) % 4) + 1
      ],
      'budget_range',
      (array['$25k to $45k', '$45k to $75k', '$75k to $120k', '$120k+'])[
        ((event_index + day_index) % 4) + 1
      ],
      'timeline',
      (array['30 days', '30 to 60 days', '60 to 90 days', '90 days+'])[
        ((event_index + day_index) % 4) + 1
      ],
      'seed_batch',
      'deterministic-20260707'
    ) as metadata
  from seed_days
  cross join lateral generate_series(1, 2 + (day_index % 4)) as event_index
),
seeded_events as (
  select * from page_events
  union all
  select * from cta_events
  union all
  select * from conversion_events
)
insert into lead_events (lead_id, created_at, event_name, event_type, source, metadata)
select lead_id, created_at, event_name, event_type, source, metadata
from seeded_events
where not exists (
  select 1
  from lead_events
  where metadata ->> 'seed_batch' = 'deterministic-20260707'
);

insert into lead_notes (lead_id, created_at, created_by, body) values
  ('lead-northstar', '2026-07-07 09:28+00', 'Ava Sinclair', 'Strong operational fit. Prioritize partner-channel workflow and discovery prep.'),
  ('lead-aurora', '2026-07-06 17:05+00', 'Ines Parker', 'Discovery booked. Confirm finance data boundaries before the call.'),
  ('lead-sable', '2026-07-06 16:11+00', 'Ava Sinclair', 'Proposal package should lead with exception reporting and fulfillment visibility.'),
  ('lead-civic', '2026-07-02 12:10+00', 'Malik West', 'Qualified but ownerless. Needs a clean follow-up path.'),
  ('lead-harbor', '2026-07-03 15:10+00', 'Malik West', 'Logistics use case is high fit; dispatch state model is the wedge.')
on conflict do nothing;

insert into analytics_snapshots (snapshot_key, date_range_key, captured_at, source, payload) values (
  'analytics_overview',
  '7d',
  '2026-07-07 10:00+00',
  'supabase',
  '{
    "dateRange":{"key":"7d","label":"Last 7 days","from":"2026-07-01T00:00:00.000Z","to":"2026-07-07T10:00:00.000Z"},
    "metrics":[
      {"key":"visitors","label":"Visitors","value":"2,840","trend":"+9%","trendDirection":"up","note":"Unique visitors"},
      {"key":"cta_clicks","label":"CTA clicks","value":416,"trend":"+13%","trendDirection":"up","note":"Allowed source data only"},
      {"key":"quick_start_submissions","label":"Quick-start submissions","value":74,"trend":"+8%","trendDirection":"up","note":"Short form intent"},
      {"key":"full_audit_submissions","label":"Full audit submissions","value":29,"trend":"+24%","trendDirection":"up","note":"High intent conversions"},
      {"key":"schedule_clicks","label":"Schedule clicks","value":18,"trend":"+11%","trendDirection":"up","note":"Booking intent"},
      {"key":"email_clicks","label":"Email clicks","value":12,"trend":"+5%","trendDirection":"up","note":"Direct reply intent"}
    ],
    "funnel":[
      {"key":"visitors","label":"Visitors","value":2840,"rate":100,"delta":"+9%"},
      {"key":"cta_clicks","label":"CTA clicks","value":416,"rate":14.6,"delta":"+13%"},
      {"key":"quick_start_submitted","label":"Quick-start submitted","value":74,"rate":17.8,"delta":"+8%"},
      {"key":"audit_started","label":"Audit started","value":51,"rate":68.9,"delta":"+18%"},
      {"key":"audit_submitted","label":"Audit submitted","value":29,"rate":56.9,"delta":"+24%"},
      {"key":"schedule_clicked","label":"Schedule clicked","value":18,"rate":62.1,"delta":"+11%"}
    ],
    "dailyVisitors":[
      {"key":"jul-01","label":"Jul 1","value":342,"context":"Unique visitors"},
      {"key":"jul-02","label":"Jul 2","value":371,"context":"Unique visitors"},
      {"key":"jul-03","label":"Jul 3","value":398,"context":"Unique visitors"},
      {"key":"jul-04","label":"Jul 4","value":426,"context":"Unique visitors"},
      {"key":"jul-05","label":"Jul 5","value":393,"context":"Unique visitors"},
      {"key":"jul-06","label":"Jul 6","value":448,"context":"Unique visitors"},
      {"key":"jul-07","label":"Jul 7","value":462,"context":"Unique visitors"}
    ],
    "dailySubmissions":[
      {"key":"jul-01","label":"Jul 1","value":9,"context":"Lead submissions"},
      {"key":"jul-02","label":"Jul 2","value":12,"context":"Lead submissions"},
      {"key":"jul-03","label":"Jul 3","value":14,"context":"Lead submissions"},
      {"key":"jul-04","label":"Jul 4","value":13,"context":"Lead submissions"},
      {"key":"jul-05","label":"Jul 5","value":17,"context":"Lead submissions"},
      {"key":"jul-06","label":"Jul 6","value":19,"context":"Lead submissions"},
      {"key":"jul-07","label":"Jul 7","value":19,"context":"Lead submissions"}
    ],
    "dailyScheduleClicks":[
      {"key":"jul-01","label":"Jul 1","value":2,"context":"Schedule clicks"},
      {"key":"jul-02","label":"Jul 2","value":3,"context":"Schedule clicks"},
      {"key":"jul-03","label":"Jul 3","value":2,"context":"Schedule clicks"},
      {"key":"jul-04","label":"Jul 4","value":4,"context":"Schedule clicks"},
      {"key":"jul-05","label":"Jul 5","value":2,"context":"Schedule clicks"},
      {"key":"jul-06","label":"Jul 6","value":3,"context":"Schedule clicks"},
      {"key":"jul-07","label":"Jul 7","value":2,"context":"Schedule clicks"}
    ],
    "dailyConversionRate":[
      {"key":"jul-01","label":"Jul 1","value":2.6,"context":"Visitor to lead"},
      {"key":"jul-02","label":"Jul 2","value":3.2,"context":"Visitor to lead"},
      {"key":"jul-03","label":"Jul 3","value":3.5,"context":"Visitor to lead"},
      {"key":"jul-04","label":"Jul 4","value":3.1,"context":"Visitor to lead"},
      {"key":"jul-05","label":"Jul 5","value":4.3,"context":"Visitor to lead"},
      {"key":"jul-06","label":"Jul 6","value":4.2,"context":"Visitor to lead"},
      {"key":"jul-07","label":"Jul 7","value":4.1,"context":"Visitor to lead"}
    ],
    "ctaClicksBySource":[
      {"key":"home_hero_form","label":"Home hero","value":118,"context":"CTA clicks"},
      {"key":"navbar_audit","label":"Navbar audit","value":86,"context":"CTA clicks"},
      {"key":"selected_work_card","label":"Selected work","value":73,"context":"CTA clicks"},
      {"key":"pricing_page","label":"Pricing page","value":54,"context":"CTA clicks"},
      {"key":"book_call_page","label":"Book call","value":47,"context":"CTA clicks"}
    ],
    "submissionsByProjectType":[
      {"key":"revenue_ops","label":"Revenue ops","value":32,"context":"Submissions"},
      {"key":"workflow_automation","label":"Workflow automation","value":25,"context":"Submissions"},
      {"key":"customer_portal","label":"Customer portal","value":19,"context":"Submissions"},
      {"key":"reporting_system","label":"Reporting system","value":16,"context":"Submissions"},
      {"key":"intake_system","label":"Intake system","value":11,"context":"Submissions"}
    ],
    "submissionsByIndustry":[
      {"key":"b2b_services","label":"B2B services","value":28,"context":"Submissions"},
      {"key":"healthcare","label":"Healthcare","value":21,"context":"Submissions"},
      {"key":"fintech","label":"Fintech","value":17,"context":"Submissions"},
      {"key":"logistics","label":"Logistics","value":14,"context":"Submissions"},
      {"key":"retail","label":"Retail and ecommerce","value":13,"context":"Submissions"}
    ],
    "submissionsByBudget":[
      {"key":"10_25","label":"$10k to $25k","value":18,"context":"Submissions"},
      {"key":"25_45","label":"$25k to $45k","value":31,"context":"Submissions"},
      {"key":"45_75","label":"$45k to $75k","value":27,"context":"Submissions"},
      {"key":"75_120","label":"$75k to $120k","value":20,"context":"Submissions"},
      {"key":"120_plus","label":"$120k+","value":7,"context":"Submissions"}
    ],
    "submissionsByTimeline":[
      {"key":"30_days","label":"30 days","value":24,"context":"Submissions"},
      {"key":"30_60","label":"30 to 60 days","value":39,"context":"Submissions"},
      {"key":"60_90","label":"60 to 90 days","value":28,"context":"Submissions"},
      {"key":"90_plus","label":"90 days+","value":12,"context":"Submissions"}
    ],
    "topLandingPages":[
      {"key":"/","label":"Home","value":940,"context":"Visitors"},
      {"key":"/selected-work","label":"Selected work","value":516,"context":"Visitors"},
      {"key":"/services","label":"Services","value":482,"context":"Visitors"},
      {"key":"/pricing","label":"Pricing","value":338,"context":"Visitors"},
      {"key":"/book-call","label":"Book call","value":244,"context":"Visitors"}
    ],
    "topReferrers":[
      {"key":"linkedin","label":"LinkedIn","value":214,"context":"Visitors"},
      {"key":"direct","label":"Direct","value":188,"context":"Visitors"},
      {"key":"google","label":"Google","value":162,"context":"Visitors"},
      {"key":"partner","label":"Partner referral","value":78,"context":"Visitors"}
    ],
    "utmCampaignPerformance":[
      {"key":"ops-scale","label":"ops-scale","value":93,"context":"Submissions"},
      {"key":"finance-systems","label":"finance-systems","value":42,"context":"Submissions"},
      {"key":"clinic-ops","label":"clinic-ops","value":31,"context":"Submissions"},
      {"key":"logistics-automation","label":"logistics-automation","value":26,"context":"Submissions"}
    ],
    "source":"supabase"
  }'::jsonb
)
on conflict do nothing;
