# Dashboard CRM ingestion

## Final architecture

The Luxa funnel and dashboard use the same Supabase project. The funnel already
persists validated `quick_start` and `platform_audit` submissions into
`public.lead_submissions`. This dashboard uses that table directly as its canonical
CRM lead model.

```text
Funnel browser
  -> funnel Server Action
  -> validation, rate limiting, idempotent insert
  -> public.lead_submissions
  -> dashboard server-only data layer
  -> authenticated CRM pages
```

There is no dashboard ingestion endpoint, projection table, backfill, webhook, or
sync job. Existing rows are already the backfill. New funnel rows appear on the next
dashboard request because the CRM reads the source table directly.

`lead_submissions.id` is the immutable record identifier. Rows are never deduplicated
by email. Multiple submissions from one contact remain separate opportunities unless
a future relationship model deliberately links them.

## Dashboard setup — copy and paste

1. Confirm the funnel and dashboard Supabase URLs contain the same project reference.

2. In Supabase, open **Project Settings -> API Keys** and create a secret key dedicated
   to the dashboard backend.

3. Configure the dashboard locally and in Vercel:

   ```env
   # Supabase Auth in the browser/server session layer
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-legacy-anon-key>

   # Elevated CRM access — server only
   SUPABASE_URL=https://<same-project-ref>.supabase.co
   SUPABASE_SECRET_KEY=sb_secret_<dashboard-specific-key>
   ```

   `SUPABASE_SERVICE_ROLE_KEY` remains a supported legacy fallback. Remove it after the
   dashboard-specific secret key has been deployed and verified.

4. Apply the dashboard migrations in order:

   - `supabase/migrations/202607170001_manual_crm_leads.sql`
   - `supabase/migrations/202607170002_lead_origin_and_ownership.sql`
   - `supabase/migrations/202607190001_lead_prospecting_fields.sql`
   - `supabase/migrations/202607200001_lead_prospecting_history.sql`
   - `supabase/migrations/202607200002_not_connected_status.sql`
   - `supabase/migrations/202607200003_lead_submission_notes.sql`

   They add manual CRM records, explicit provenance/ownership, and nullable
   prospecting context without changing the funnel's existing form types or required
   insert fields.

5. Verify connectivity without returning lead PII:

   ```powershell
   npm run crm:verify
   ```

   Expected shape:

   ```json
   {
     "ok": true,
     "projectRef": "<project-ref>",
     "source": "public.lead_submissions",
     "rows": 0,
     "mode": "direct"
   }
   ```

6. Submit a test lead through the funnel, refresh `/dashboard/leads`, and confirm the
   row appears. Repeated dashboard refreshes must not create any record because reads
   have no ingestion side effect.

7. Create a manual lead from `/dashboard/leads/new`. It is stored with
   `form_type = 'manual'`, `origin = 'manual'`, and the authenticated administrator as
   both creator and initial owner. Funnel submissions retain `quick_start` or
   `platform_audit`, default to `origin = 'website'`, and have no human creator.

## Data and security contract

- CRM database access exists only in `server-only` modules.
- Every dashboard mutation re-authenticates and requires the admin role.
- Route handlers independently authorize requests.
- Client Components receive explicit lead DTOs rather than unrestricted Supabase rows.
- Queries omit `source_hash` and `idempotency_key` from UI projections. Creator and
  owner IDs are projected only for provenance and future assignment behavior.
- Umami never receives lead PII or free text.
- Secret/service-role keys must never use a `NEXT_PUBLIC_` prefix.

## Ongoing ingestion

No reconciliation job is required for the shared-table architecture. A newly committed
funnel row is immediately eligible for the next dashboard query. If the row is absent:

1. Run `npm run crm:verify` in both deployments' configuration context.
2. Compare the Supabase project references.
3. Confirm the funnel Server Action returned its durable submission ID.
4. Check the dashboard date/search filters.
5. Query `public.lead_submissions` by the source ID in Supabase.

Do not add a second public `/api/leads` route to fix a configuration mismatch.

## Acceptance checks

- An existing source row appears in `/dashboard/leads`.
- A new funnel submission appears after refresh.
- Refreshing creates no duplicates.
- Two source rows sharing an email remain two records.
- Manual creation produces a `manual` record.
- Website and manual records display distinct origins.
- Manual creation records the authenticated creator and initial owner.
- Unauthorized requests cannot list, export, or mutate CRM data.
- Status and notes persist without overwriting funnel answers.
- Prospecting details can be added to both existing and manual lead records.
- Every prospecting save retains an append-only snapshot with server-side pagination.
- Internal notes are stored as individual records and can be edited or deleted by admins.
- Funnel inserts continue to succeed without supplying any prospecting fields.
- `npm run typecheck`, `npm run lint`, `npm run format:check`, and `npm run build` pass.

## Rollback

Code rollback requires no data migration because the dashboard does not project or
copy funnel records. If the dedicated secret key causes a deployment issue, restore
the previous server-only `SUPABASE_SERVICE_ROLE_KEY`, redeploy, then diagnose before
revoking either key. Do not delete `lead_submissions` rows during rollback.
