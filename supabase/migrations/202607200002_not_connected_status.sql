alter table public.lead_submissions
  drop constraint if exists lead_submissions_connection_status_check;

alter table public.lead_submissions
  add constraint lead_submissions_connection_status_check
  check (
    connection_status is null or connection_status in (
      'not_researched',
      'identified',
      'not_connected',
      'connection_sent',
      'connected',
      'contacted',
      'replied'
    )
  );

alter table public.lead_prospecting_history
  drop constraint if exists lead_prospecting_history_connection_status_check;

alter table public.lead_prospecting_history
  add constraint lead_prospecting_history_connection_status_check
  check (
    connection_status is null or connection_status in (
      'not_researched',
      'identified',
      'not_connected',
      'connection_sent',
      'connected',
      'contacted',
      'replied'
    )
  );
