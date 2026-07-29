# Supabase authentication deployment

The application uses Supabase Auth for invitations, recovery, password updates,
session identity, and future TOTP MFA.

Before deploying this feature:

1. Apply `supabase/migrations/202607290001_workspace_access_management.sql`.
2. Set the Supabase Auth Site URL to the production `NEXT_PUBLIC_APP_URL`.
3. Add `${NEXT_PUBLIC_APP_URL}/auth/confirm` to the Auth redirect URL allowlist.
4. In Authentication → Email Templates, set:
   - Invite user: `supabase/templates/invite.html`
   - Reset password: `supabase/templates/recovery.html`
   - Password changed notification: `supabase/templates/password-changed.html`
5. Enable the password-changed security notification.
6. Keep public sign-up disabled.

Run `npm run access:verify` in the deployment configuration after applying the
migration. It must report `ok: true` before invitations are enabled.

The custom templates deliberately send `token_hash` to the server-side
`/auth/confirm` handler. Do not replace those links with browser URL-fragment links;
URL fragments are not available to the server and do not establish the SSR cookie
session used by this application.

For incident response, “End sessions” revokes every Luxa session registered for the
member and advances the account session cutoff. “Freeze access” additionally bans the
Supabase Auth user until an administrator restores access. Supabase JWT expiry should
remain short so upstream access tokens age out promptly.

MFA is represented in the access model and team security posture but is not enforced
until the TOTP enrollment and challenge experience ships. At that point, sensitive
permissions can require the `aal2` claim without changing the member schema.
