# Luxa operations workspace

Private Next.js workspace for lead operations and privacy-safe growth intelligence.

## Local setup

Copy `.env.example` to `.env.local` and configure:

- Supabase public URL and anonymous key for workspace authentication.
- Supabase server URL and secret key for protected CRM operations.
- Umami host, website ID, API URL, and API token for analytics.

Then run:

```bash
npm install
npm run dev
```

## Launch verification

Run the complete local quality gate:

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
```

Verify the connected production data sources:

```bash
npm run crm:verify
npm run access:verify
npm run analytics:verify
```

`crm:smoke` performs a reversible live create/update/note/delete lifecycle against
the configured CRM project. Use it immediately before launch or after database
changes:

```bash
npm run crm:smoke
```

## Data boundaries

- Supabase is the source of truth for leads, notes, and prospecting history.
- Umami supplies native traffic, realtime, page quality, acquisition,
  ordered-funnel, session timing, and Core Web Vitals signals.
- The primary ordered funnel is `/audit` reach -> audit start -> audit submission.
  Homepage quick-start submissions and `/book-call` scheduling clicks remain separate
  conversion signals. Current-page reports include the consolidated public routes,
  case-study details, and valid industry pages while excluding redirect-only
  `/solutions/*` legacy paths.
- Analytics property collection is allowlisted and excludes lead identity fields.
- Dashboard and dashboard API routes require an active Supabase workspace user with a
  server-controlled `admin` or `sales_exec` role. Sales access is limited to assigned
  leads; global analytics, export, team administration, and settings remain admin-only.
- Sales executives can submit and track their own in-app feedback. Administrators can
  review and triage the complete paginated feedback queue.
- Lead CSV exports are authenticated, non-cacheable, and neutralize spreadsheet
  formula input.

Sales executives are provisioned only from the admin Team screen after the workspace
access and sales-operations migrations and email templates are configured. See
`docs/supabase-auth-setup.md`.

The analytics layer fetches signal groups independently. Optional endpoint failures
remain visible in Launch readiness without blanking the rest of the dashboard.
