begin;

create table if not exists public.workspace_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  job_title text,
  role text not null check (role in ('admin', 'sales_exec')),
  status text not null default 'invited'
    check (status in ('invited', 'active', 'frozen')),
  invited_by uuid references auth.users (id) on delete set null,
  invited_at timestamptz,
  accepted_at timestamptz,
  frozen_at timestamptz,
  freeze_reason text,
  sessions_valid_after timestamptz not null default now(),
  mfa_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_members_email_length
    check (char_length(email) between 3 and 320),
  constraint workspace_members_display_name_length
    check (char_length(trim(display_name)) between 2 and 100),
  constraint workspace_members_job_title_length
    check (job_title is null or char_length(job_title) <= 100),
  constraint workspace_members_freeze_reason_length
    check (freeze_reason is null or char_length(freeze_reason) <= 240)
);

create unique index if not exists workspace_members_email_unique_idx
  on public.workspace_members (lower(email));

create index if not exists workspace_members_role_status_idx
  on public.workspace_members (role, status);

create table if not exists public.workspace_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  ip_address text,
  user_agent text,
  assurance_level text not null default 'aal1'
    check (assurance_level in ('aal1', 'aal2')),
  constraint workspace_sessions_ip_length
    check (ip_address is null or char_length(ip_address) <= 64),
  constraint workspace_sessions_user_agent_length
    check (user_agent is null or char_length(user_agent) <= 512)
);

create index if not exists workspace_sessions_user_last_seen_idx
  on public.workspace_sessions (user_id, last_seen_at desc);

create index if not exists workspace_sessions_active_idx
  on public.workspace_sessions (last_seen_at desc)
  where revoked_at is null;

create table if not exists public.workspace_security_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_user_id uuid references auth.users (id) on delete set null,
  target_user_id uuid references auth.users (id) on delete set null,
  target_email text,
  session_id uuid,
  action text not null check (
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
      'lead_assigned'
    )
  ),
  outcome text not null default 'success'
    check (outcome in ('success', 'denied', 'failed')),
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  constraint workspace_security_events_email_length
    check (target_email is null or char_length(target_email) <= 320),
  constraint workspace_security_events_ip_length
    check (ip_address is null or char_length(ip_address) <= 64),
  constraint workspace_security_events_user_agent_length
    check (user_agent is null or char_length(user_agent) <= 512),
  constraint workspace_security_events_metadata_size
    check (pg_column_size(metadata) <= 8192)
);

create index if not exists workspace_security_events_created_idx
  on public.workspace_security_events (created_at desc);

create index if not exists workspace_security_events_target_created_idx
  on public.workspace_security_events (target_user_id, created_at desc);

alter table public.workspace_members enable row level security;
alter table public.workspace_sessions enable row level security;
alter table public.workspace_security_events enable row level security;

revoke all on table public.workspace_members from anon, authenticated;
revoke all on table public.workspace_sessions from anon, authenticated;
revoke all on table public.workspace_security_events from anon, authenticated;

grant select, insert, update on table public.workspace_members to service_role;
grant select, insert, update on table public.workspace_sessions to service_role;
grant select, insert on table public.workspace_security_events to service_role;

drop trigger if exists set_workspace_member_updated_at
  on public.workspace_members;
create trigger set_workspace_member_updated_at
before update on public.workspace_members
for each row execute function public.set_lead_submission_updated_at();

insert into public.workspace_members (
  user_id,
  email,
  display_name,
  role,
  status,
  accepted_at,
  sessions_valid_after
)
select
  auth_user.id,
  auth_user.email,
  case
    when char_length(
      coalesce(
        nullif(trim(auth_user.raw_user_meta_data ->> 'full_name'), ''),
        split_part(auth_user.email, '@', 1)
      )
    ) >= 2
      then left(
        coalesce(
          nullif(trim(auth_user.raw_user_meta_data ->> 'full_name'), ''),
          split_part(auth_user.email, '@', 1)
        ),
        100
      )
    else 'Luxa teammate'
  end,
  auth_user.raw_app_meta_data ->> 'role',
  case
    when auth_user.banned_until is not null and auth_user.banned_until > now()
      then 'frozen'
    else 'active'
  end,
  coalesce(auth_user.confirmed_at, auth_user.created_at),
  auth_user.created_at
from auth.users as auth_user
where auth_user.email is not null
  and auth_user.raw_app_meta_data ->> 'role' in ('admin', 'sales_exec')
on conflict (user_id) do update
set
  email = excluded.email,
  role = excluded.role,
  updated_at = now();

comment on table public.workspace_members is
  'Server-managed Luxa workspace membership, role, access state, and session cutoff.';

comment on table public.workspace_sessions is
  'Application session registry keyed by the Supabase JWT session_id claim.';

comment on table public.workspace_security_events is
  'Append-only application security trail for authentication and administrator actions.';

commit;
