# Account model and future RBAC

## Current production state

Public Supabase registration remains disabled. The dashboard accepts only users whose
server-controlled Supabase `app_metadata.role` is exactly `admin`. No other role is
authorized by the proxy, Route Handlers, or Server Actions.

Administrators are currently created in Supabase Authentication and granted the role
server-side. Do not place roles in user-editable `user_metadata` and do not expose the
Supabase secret key to the browser.

Lead provenance is independent from account authorization:

- `origin` records how a lead entered the CRM: `website`, `manual`, `import`, or
  `integration`.
- `created_by` records the authenticated team member who created a record. It is null
  for website or system ingestion.
- `owner_user_id` records responsibility for follow-up. Manual leads currently default
  to their creator; website leads start unassigned.
- Marketing attribution remains in `attribution`. It is not an ownership field.

## Recommended account model

Keep public Supabase sign-up disabled. Create or invite team members through an
admin-controlled, server-only workflow, then assign their role server-side.

| Role          | Recommended access                                                                                                                              |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `admin`       | Everything, including users, settings, analytics, exports, and role management.                                                                 |
| `sales_admin` | All leads, assignments, notes, and pipeline management. No users, roles, system settings, secret configuration, or global export.               |
| `sales_rep`   | Assigned leads, leads they created, notes, and follow-ups. No global lead list, assignment administration, analytics administration, or export. |
| `viewer`      | Read-only aggregate reporting. No lead PII, mutations, notes, assignments, users, settings, or export.                                          |

The `sales_admin` boundary above is the proposed exact scope. It must be approved before
the role is enabled. In particular, `leads.export` remains admin-only.

## Proposed permissions

| Permission              | Admin | Sales admin |   Sales rep   | Viewer |
| ----------------------- | :---: | :---------: | :-----------: | :----: |
| `dashboard.access`      |  Yes  |     Yes     |      Yes      |  Yes   |
| `leads.read_all`        |  Yes  |     Yes     |      No       |   No   |
| `leads.read_assigned`   |  Yes  |     Yes     |      Yes      |   No   |
| `leads.create`          |  Yes  |     Yes     |      Yes      |   No   |
| `leads.update_pipeline` |  Yes  |     Yes     | Assigned only |   No   |
| `leads.add_notes`       |  Yes  |     Yes     | Assigned only |   No   |
| `leads.assign`          |  Yes  |     Yes     |      No       |   No   |
| `leads.export`          |  Yes  |     No      |      No       |   No   |
| `reporting.read`        |  Yes  |     Yes     |    Limited    |  Yes   |
| `analytics.manage`      |  Yes  |     No      |      No       |   No   |
| `members.invite`        |  Yes  |     No      |      No       |   No   |
| `members.manage_roles`  |  Yes  |     No      |      No       |   No   |
| `settings.manage`       |  Yes  |     No      |      No       |   No   |

## Durable Supabase implementation

When the first non-admin role is introduced:

1. Add a `workspace_members` table keyed by `auth.users.id`, with membership status,
   workspace, display name, and role. Add `user_roles` and `role_permissions` tables if
   permissions need to be independently configurable.
2. Add a Supabase Custom Access Token Hook that projects the server-controlled role or
   permission set into the access-token JWT.
3. Replace the current `isAdminUser` checks with centralized `requirePermission()`
   checks. Every Server Action and Route Handler must authorize its own operation.
4. Add RLS policies for authenticated dashboard access. Sales representatives should
   only see rows where `owner_user_id = auth.uid()` or `created_by = auth.uid()`.
5. Keep funnel ingestion on a separate server-only Supabase client. Secret keys bypass
   RLS and must never be used by browser code.
6. Add an admin-only invitation workflow using
   `supabase.auth.admin.inviteUserByEmail()`. Create the pending workspace membership
   and selected role in the same trusted server workflow.
7. Refresh or reissue sessions after role changes so access-token claims cannot retain
   stale permissions.
8. Add an immutable audit event for invitations, role changes, ownership changes,
   exports, and pipeline mutations.

Supabase's recommended RBAC pattern uses role/permission tables with a Custom Access
Token Hook:
https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac

Supabase invitations must be issued from a trusted server environment:
https://supabase.com/docs/guides/auth/users#inviting-users

## Enablement gate

Do not authorize `sales_admin`, `sales_rep`, or `viewer` merely by adding a new string
to the proxy. A role is ready only when its permission checks, RLS policies, route tests,
PII boundaries, navigation visibility, and session-refresh behavior have all been
implemented and verified.
