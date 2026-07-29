# Workspace account model and RBAC

## Production roles

Public Supabase registration remains disabled. Luxa supports two server-controlled
workspace roles:

| Role         | Access                                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `admin`      | Global CRM, lead assignment, Umami analytics, export, team administration, sessions, security events, and system settings.    |
| `sales_exec` | Personal operating dashboard, assigned leads, lead creation, updates, notes, follow-ups, and their own account security view. |

Roles and account state live in Supabase `app_metadata` for the inexpensive proxy gate
and in `public.workspace_members` for authoritative server authorization. Never place
authorization claims in user-editable `user_metadata`, and never expose a Supabase
secret key to the browser.

## Permission boundary

| Permission                            | Admin | Sales executive |
| ------------------------------------- | :---: | :-------------: |
| Dashboard access                      |  Yes  |       Yes       |
| Read all leads                        |  Yes  |       No        |
| Read assigned leads                   |  Yes  |       Yes       |
| Create leads                          |  Yes  |       Yes       |
| Update all leads                      |  Yes  |       No        |
| Update assigned leads and notes       |  Yes  |       Yes       |
| Assign or unassign leads              |  Yes  |       No        |
| Read global Umami analytics           |  Yes  |       No        |
| Export lead PII                       |  Yes  |       No        |
| Invite and manage members             |  Yes  |       No        |
| Read all sessions and security events |  Yes  |       No        |
| Manage system settings                |  Yes  |       No        |

Every Server Component, Server Action, and Route Handler authorizes independently.
Sales reads and mutations include `owner_user_id = current user`; hidden navigation is
only a usability layer. The dashboard uses a trusted server-side data broker, while
public ingestion remains a separate server-only path.

Lead provenance remains independent from authorization:

- `origin` records how a lead entered the CRM: `website`, `manual`, `import`, or
  `integration`.
- `created_by` records the authenticated creator. It is null for website or system
  ingestion.
- `owner_user_id` controls sales-executive visibility and follow-up responsibility.
  Leads created by a sales executive default to that executive; website leads start
  unassigned.
- Marketing attribution remains in `attribution`; it is never an ownership field.

## Membership and incident states

`workspace_members.status` has deliberately small semantics:

- `invited`: email control and password setup are not complete.
- `active`: the member may establish sessions and use role permissions.
- `frozen`: new sign-in is banned and application sessions are rejected until an
  administrator restores the account.

“End all sessions” revokes registered Luxa sessions and advances
`sessions_valid_after`, while leaving the account active for a clean future login.
“Freeze account” additionally bans the Supabase Auth user and records a required
incident reason. Restore never revives an old session.

`workspace_security_events` is append-only from the application and records invitation,
activation, sign-in, recovery, session, freeze/restore, and assignment actions. Raw
access or refresh tokens are never stored; `workspace_sessions` stores only the verified
JWT `session_id`, timestamps, assurance level, and bounded request metadata.

## MFA path

The session registry already captures Supabase AAL1/AAL2 and the team view inspects
verified TOTP factors. `mfa_required` is reserved in membership policy. Do not set it
until enrollment, recovery-code, challenge, and step-up authorization screens ship
together. That rollout can require AAL2 for member administration without changing the
role or membership schema.

## Deployment gate

Before enabling invitations:

1. Apply `supabase/migrations/202607290001_workspace_access_management.sql`.
2. Configure the production Site URL and `/auth/confirm` allowlist.
3. Install the invite, recovery, and password-changed templates.
4. Keep public sign-up disabled and use short Supabase JWT expiry.
5. Verify an invite, activation, login, reset, session termination, freeze, restore,
   assignment, and assigned-lead access with a non-production sales account.

The application disables and server-blocks invitations when the access registry is
missing. See `docs/supabase-auth-setup.md` for the exact Supabase configuration.
