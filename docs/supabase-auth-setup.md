# Supabase authentication deployment

The application uses Supabase Auth for invitations, recovery, password updates,
session identity, and future TOTP MFA.

Before deploying this feature:

1. Apply `supabase/migrations/202607290001_workspace_access_management.sql` and
   `supabase/migrations/202607290002_sales_operations_experience.sql`.
2. Set the Supabase Auth Site URL to `https://luxa-dashboard.vercel.app`.
3. Add these exact URLs to the Auth redirect URL allowlist:
   - `https://luxa-dashboard.vercel.app/auth/confirm`
   - `https://luxa-dashboard.vercel.app/auth/email-callback?mode=invite`
   - `https://luxa-dashboard.vercel.app/auth/email-callback?mode=recovery`
4. Remove localhost from the production project allowlist.
5. In Authentication → Email Templates, set:
   - Invite user: `supabase/templates/invite.html`
   - Reset password: `supabase/templates/recovery.html`
   - Password changed notification: `supabase/templates/password-changed.html`
6. Enable the password-changed security notification.
7. Keep public sign-up disabled.
8. In Vercel Production environment variables, set
   `SUPABASE_AUTH_EMAILS_VERIFIED=true` only after steps 2â€“7 are complete, then
   redeploy. Without this attestation, Luxa deliberately blocks invitation and
   recovery emails instead of allowing Supabase to fall back to an unsafe URL.
9. In Vercel, enable **Automatically expose System Environment Variables** and
   **Settings â†’ Advanced â†’ Skew Protection**, then redeploy. This keeps existing
   browser sessions on compatible Server Actions during releases.

Production invitation and recovery emails use literal callback URLs under
`https://luxa-dashboard.vercel.app`. They do not read request headers,
deployment URLs, `NODE_ENV`, `NEXT_PUBLIC_APP_URL`, `APP_URL`, or
`AUTH_EMAIL_CALLBACK_ORIGIN`.

Run `npm run access:verify` in the deployment configuration after applying the
migration. It must report `ok: true` before invitations are enabled.

The verification flag is an operator attestation; it does not change Supabase
configuration. A generated link containing `redirect_to=http://localhost:3000`
means Supabase rejected the requested callback and fell back to its Site URL.
Correct the hosted project settings before setting the flag.

The custom templates deliberately send `token_hash` to the server-side
`/auth/confirm` handler at the canonical production origin. This is a second
defense against a stale Supabase Site URL or redirect allowlist. Do not replace
those links with browser URL-fragment links; URL fragments are not available to
the server and do not establish the SSR cookie session used by this application.

If Supabase's default Invite or Recovery template is active, its verification
endpoint redirects to `/auth/email-callback`. Luxa can complete that browser
session and open `/set-password`, but production must use the checked-in templates
before email delivery is marked verified.

For incident response, “End sessions” revokes every Luxa session registered for
the member and advances the account session cutoff. “Freeze access” additionally
bans the Supabase Auth user until an administrator restores access. Supabase JWT
expiry should remain short so upstream access tokens age out promptly.

MFA is represented in the access model and team security posture but is not
enforced until the TOTP enrollment and challenge experience ships. At that point,
sensitive permissions can require the `aal2` claim without changing the member
schema.
