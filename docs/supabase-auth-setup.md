# Supabase authentication deployment

The application uses Supabase Auth for invitations, recovery, password updates,
session identity, and future TOTP MFA.

Before deploying this feature:

1. Apply `supabase/migrations/202607290001_workspace_access_management.sql` and
   `supabase/migrations/202607290002_sales_operations_experience.sql`.
2. Set the Supabase Auth Site URL to
   `https://luxa-dashboard.vercel.app`.
3. Add `https://luxa-dashboard.vercel.app/auth/confirm` to the Auth redirect URL
   allowlist. Remove localhost from the production project allowlist after testing.
4. In Authentication → Email Templates, set:
   - Invite user: `supabase/templates/invite.html`
   - Reset password: `supabase/templates/recovery.html`
   - Password changed notification: `supabase/templates/password-changed.html`
5. Enable the password-changed security notification.
6. Keep public sign-up disabled.

Production invitation and recovery callbacks are hard-pinned to
`https://luxa-dashboard.vercel.app` in application code. They cannot be replaced
by request headers, preview deployment URLs, `NEXT_PUBLIC_APP_URL`, `APP_URL`, or
a stale localhost environment value. `AUTH_EMAIL_CALLBACK_ORIGIN` remains
available only for local and test environments.

Run `npm run access:verify` in the deployment configuration after applying the
migration. It must report `ok: true` before invitations are enabled.

The custom templates deliberately send `token_hash` to the server-side
`/auth/confirm` handler at the canonical production origin. This is a second
defense against a stale Supabase Site URL or redirect allowlist. Do not replace
those links with browser URL-fragment links; URL fragments are not available to
the server and do not establish the SSR cookie session used by this application.

For incident response, “End sessions” revokes every Luxa session registered for the
member and advances the account session cutoff. “Freeze access” additionally bans the
Supabase Auth user until an administrator restores access. Supabase JWT expiry should
remain short so upstream access tokens age out promptly.

MFA is represented in the access model and team security posture but is not enforced
until the TOTP enrollment and challenge experience ships. At that point, sensitive
permissions can require the `aal2` claim without changing the member schema.
