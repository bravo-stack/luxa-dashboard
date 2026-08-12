begin;

create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  tracking_id text not null unique,
  name text not null,
  utm_campaign text not null unique,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint marketing_campaigns_tracking_id_format
    check (tracking_id ~ '^cmp_[a-f0-9]{12}$'),
  constraint marketing_campaigns_name_length
    check (char_length(name) between 2 and 120),
  constraint marketing_campaigns_utm_format
    check (char_length(utm_campaign) <= 160 and utm_campaign ~ '^[a-z0-9]+([_-][a-z0-9]+)*$')
);

create table if not exists public.marketing_links (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.marketing_campaigns (id) on delete restrict,
  public_code text not null unique,
  name text not null,
  destination_path text not null default '/audit',
  channel text not null,
  utm_source text not null,
  utm_medium text not null,
  utm_content text,
  utm_term text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint marketing_links_public_code_format
    check (public_code ~ '^[a-f0-9]{12}$'),
  constraint marketing_links_name_length
    check (char_length(name) between 2 and 120),
  constraint marketing_links_destination
    check (destination_path = '/audit'),
  constraint marketing_links_channel
    check (channel in (
      'linkedin_organic', 'linkedin_paid', 'instagram_organic',
      'facebook_organic', 'meta_paid', 'google_ads', 'email',
      'whatsapp', 'partner', 'direct_outreach', 'other'
    )),
  constraint marketing_links_source_format
    check (char_length(utm_source) <= 100 and utm_source ~ '^[a-z0-9]+([_-][a-z0-9]+)*$'),
  constraint marketing_links_medium_format
    check (char_length(utm_medium) <= 100 and utm_medium ~ '^[a-z0-9]+([_-][a-z0-9]+)*$'),
  constraint marketing_links_content_format
    check (utm_content is null or (char_length(utm_content) <= 160 and utm_content ~ '^[a-z0-9]+([_-][a-z0-9]+)*$')),
  constraint marketing_links_term_format
    check (utm_term is null or (char_length(utm_term) <= 160 and utm_term ~ '^[a-z0-9]+([_-][a-z0-9]+)*$'))
);

create table if not exists public.marketing_link_daily_stats (
  marketing_link_id uuid not null references public.marketing_links (id) on delete restrict,
  stat_date date not null,
  redirect_requests bigint not null default 0 check (redirect_requests >= 0),
  updated_at timestamptz not null default now(),
  primary key (marketing_link_id, stat_date)
);

create index if not exists marketing_campaigns_created_idx
  on public.marketing_campaigns (created_at desc);
create index if not exists marketing_links_campaign_created_idx
  on public.marketing_links (campaign_id, created_at desc);
create index if not exists marketing_link_stats_date_idx
  on public.marketing_link_daily_stats (stat_date desc, marketing_link_id);
create index if not exists lead_submissions_first_campaign_idx
  on public.lead_submissions ((attribution ->> 'first_touch_campaign_id'))
  where attribution ? 'first_touch_campaign_id';
create index if not exists lead_submissions_first_link_idx
  on public.lead_submissions ((attribution ->> 'first_touch_link_id'))
  where attribution ? 'first_touch_link_id';
create index if not exists lead_submissions_last_campaign_idx
  on public.lead_submissions ((attribution ->> 'last_touch_campaign_id'))
  where attribution ? 'last_touch_campaign_id';
create index if not exists lead_submissions_last_link_idx
  on public.lead_submissions ((attribution ->> 'last_touch_link_id'))
  where attribution ? 'last_touch_link_id';

alter table public.marketing_campaigns enable row level security;
alter table public.marketing_links enable row level security;
alter table public.marketing_link_daily_stats enable row level security;

revoke all on table public.marketing_campaigns from anon, authenticated;
revoke all on table public.marketing_links from anon, authenticated;
revoke all on table public.marketing_link_daily_stats from anon, authenticated;
grant select, insert, update on table public.marketing_campaigns to service_role;
grant select, insert, update on table public.marketing_links to service_role;
grant select, insert, update on table public.marketing_link_daily_stats to service_role;

create or replace function public.set_marketing_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.protect_marketing_campaign_tracking()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.tracking_id is distinct from old.tracking_id
    or new.utm_campaign is distinct from old.utm_campaign then
    raise exception 'Published campaign tracking fields are immutable';
  end if;
  return new;
end;
$$;

create or replace function public.protect_marketing_link_tracking()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.campaign_id is distinct from old.campaign_id
    or new.public_code is distinct from old.public_code
    or new.destination_path is distinct from old.destination_path
    or new.channel is distinct from old.channel
    or new.utm_source is distinct from old.utm_source
    or new.utm_medium is distinct from old.utm_medium
    or new.utm_content is distinct from old.utm_content
    or new.utm_term is distinct from old.utm_term then
    raise exception 'Published link tracking fields are immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists set_marketing_campaign_updated_at on public.marketing_campaigns;
create trigger set_marketing_campaign_updated_at
before update on public.marketing_campaigns
for each row execute function public.set_marketing_updated_at();

drop trigger if exists protect_marketing_campaign_tracking on public.marketing_campaigns;
create trigger protect_marketing_campaign_tracking
before update on public.marketing_campaigns
for each row execute function public.protect_marketing_campaign_tracking();

drop trigger if exists set_marketing_link_updated_at on public.marketing_links;
create trigger set_marketing_link_updated_at
before update on public.marketing_links
for each row execute function public.set_marketing_updated_at();

drop trigger if exists protect_marketing_link_tracking on public.marketing_links;
create trigger protect_marketing_link_tracking
before update on public.marketing_links
for each row execute function public.protect_marketing_link_tracking();

create or replace function public.resolve_marketing_link_and_increment(code text)
returns table (
  destination_path text,
  campaign_id text,
  link_id text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  counted boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved record;
  was_counted boolean := true;
begin
  if code !~ '^[a-f0-9]{12}$' then
    return;
  end if;

  select
    link.id,
    link.destination_path,
    link.public_code,
    link.utm_source,
    link.utm_medium,
    link.utm_content,
    link.utm_term,
    campaign.tracking_id,
    campaign.utm_campaign
  into resolved
  from public.marketing_links as link
  join public.marketing_campaigns as campaign on campaign.id = link.campaign_id
  where link.public_code = code;

  if not found then
    return;
  end if;

  begin
    insert into public.marketing_link_daily_stats (
      marketing_link_id,
      stat_date,
      redirect_requests
    ) values (
      resolved.id,
      (now() at time zone 'utc')::date,
      1
    )
    on conflict (marketing_link_id, stat_date)
    do update set
      redirect_requests = public.marketing_link_daily_stats.redirect_requests + 1,
      updated_at = now();
  exception when others then
    was_counted := false;
  end;

  return query select
    resolved.destination_path,
    resolved.tracking_id,
    resolved.public_code,
    resolved.utm_source,
    resolved.utm_medium,
    resolved.utm_campaign,
    resolved.utm_content,
    resolved.utm_term,
    was_counted;
end;
$$;

revoke all on function public.resolve_marketing_link_and_increment(text) from public;
revoke all on function public.resolve_marketing_link_and_increment(text) from anon, authenticated;
grant execute on function public.resolve_marketing_link_and_increment(text) to service_role;

alter table public.workspace_security_events
  drop constraint if exists workspace_security_events_action_check;
alter table public.workspace_security_events
  add constraint workspace_security_events_action_check check (action in (
    'invite_sent', 'account_activated', 'login_succeeded', 'login_failed',
    'logout', 'password_reset_requested', 'password_changed', 'sessions_revoked',
    'account_frozen', 'account_unfrozen', 'lead_assigned', 'lead_claimed',
    'lead_deletion_requested', 'lead_deletion_approved', 'lead_deletion_rejected',
    'campaign_created', 'campaign_updated', 'campaign_archived',
    'campaign_link_created', 'campaign_link_updated'
  ));

comment on table public.marketing_link_daily_stats is
  'Privacy-safe UTC redirect-request aggregates; no visitor-level data is stored.';
comment on function public.resolve_marketing_link_and_increment(text) is
  'Resolves an immutable Luxa campaign link and increments its aggregate request counter.';

commit;
