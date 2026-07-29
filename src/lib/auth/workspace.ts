import 'server-only';

import { headers } from 'next/headers';
import type { User } from '@supabase/supabase-js';

import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import {
  hasWorkspacePermission,
  isSessionIssuedAfter,
  isWorkspaceRole,
  isWorkspaceStatus,
} from './policy';
import type {
  DashboardIdentity,
  SecurityEventAction,
  WorkspacePermission,
  WorkspaceRole,
  WorkspaceSessionIdentity,
  WorkspaceStatus,
  WorkspaceUser,
} from './types';

type MemberRow = {
  user_id: string;
  email: string;
  display_name: string;
  job_title: string | null;
  role: string;
  status: string;
  sessions_valid_after: string | null;
  mfa_required: boolean | null;
};

type RequestMetadata = {
  ipAddress: string | null;
  userAgent: string | null;
};

type SecurityEventInput = {
  action: SecurityEventAction;
  actorUserId?: string | null;
  targetUserId?: string | null;
  targetEmail?: string | null;
  sessionId?: string | null;
  outcome?: 'success' | 'denied' | 'failed';
  metadata?: Record<string, boolean | number | string | null>;
};

const memberSelect =
  'user_id,email,display_name,job_title,role,status,sessions_valid_after,mfa_required';

function safeString(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function getMetadataRole(user: User): WorkspaceRole | null {
  const role = user.app_metadata?.role;
  return isWorkspaceRole(role) ? role : null;
}

function getMetadataStatus(user: User, role: WorkspaceRole): WorkspaceStatus {
  const status = user.app_metadata?.account_status;

  if (isWorkspaceStatus(status)) return status;
  return role === 'admin' ? 'active' : 'invited';
}

function isMissingWorkspaceTable(error: { code?: string; message?: string } | null) {
  const message = error?.message ?? '';

  return Boolean(
    error &&
    (error.code === '42P01' ||
      error.code === 'PGRST205' ||
      /could not find the table ['"]public\.workspace_/i.test(message) ||
      /relation ['"](?:public\.)?workspace_[^'"]*['"] does not exist/i.test(message)),
  );
}

async function getMember(user: User): Promise<MemberRow | null> {
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('workspace_members')
    .select(memberSelect)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!error) return data as MemberRow | null;

  const metadataRole = getMetadataRole(user);

  if (isMissingWorkspaceTable(error) && metadataRole === 'admin') {
    return {
      user_id: user.id,
      email: user.email ?? '',
      display_name:
        safeString(user.user_metadata?.full_name, 100) ||
        safeString(user.email?.split('@')[0], 100) ||
        'Luxa Admin',
      job_title: safeString(user.user_metadata?.job_title, 100) || null,
      role: metadataRole,
      status: 'active',
      sessions_valid_after: user.created_at,
      mfa_required: false,
    };
  }

  return null;
}

function getSessionIdentity(claims: Record<string, unknown>): WorkspaceSessionIdentity {
  const issuedAt =
    typeof claims.iat === 'number' ? new Date(claims.iat * 1_000).toISOString() : null;
  const expiresAt =
    typeof claims.exp === 'number' ? new Date(claims.exp * 1_000).toISOString() : null;

  return {
    id: safeString(claims.session_id, 64) || null,
    issuedAt,
    expiresAt,
    assuranceLevel: claims.aal === 'aal2' ? 'aal2' : 'aal1',
  };
}

async function getRequestMetadata(): Promise<RequestMetadata> {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim();

  return {
    ipAddress: safeString(forwardedFor ?? requestHeaders.get('x-real-ip'), 64) || null,
    userAgent: safeString(requestHeaders.get('user-agent'), 512) || null,
  };
}

async function getRevokedAt(sessionId: string) {
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('workspace_sessions')
    .select('revoked_at')
    .eq('id', sessionId)
    .maybeSingle();

  if (error) return isMissingWorkspaceTable(error) ? null : 'unknown';
  return data?.revoked_at ? String(data.revoked_at) : null;
}

async function touchWorkspaceSession(user: WorkspaceUser) {
  if (!user.session.id) return;

  const supabaseAdmin = getSupabaseAdminClient();
  const request = await getRequestMetadata();
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('workspace_sessions')
    .select('last_seen_at,revoked_at')
    .eq('id', user.session.id)
    .maybeSingle();

  if (error && !isMissingWorkspaceTable(error)) {
    console.error('Unable to inspect workspace session', error.message);
    return;
  }

  if (data?.revoked_at) return;

  if (!data) {
    const insertResult = await supabaseAdmin.from('workspace_sessions').insert({
      id: user.session.id,
      user_id: user.id,
      first_seen_at: now,
      last_seen_at: now,
      expires_at: user.session.expiresAt,
      ip_address: request.ipAddress,
      user_agent: request.userAgent,
      assurance_level: user.session.assuranceLevel,
    });

    if (insertResult.error && !isMissingWorkspaceTable(insertResult.error)) {
      console.error('Unable to register workspace session', insertResult.error.message);
    }

    return;
  }

  const lastSeenAt = new Date(String(data.last_seen_at)).getTime();

  if (Number.isFinite(lastSeenAt) && Date.now() - lastSeenAt < 5 * 60 * 1_000) {
    return;
  }

  const updateResult = await supabaseAdmin
    .from('workspace_sessions')
    .update({
      last_seen_at: now,
      expires_at: user.session.expiresAt,
      ip_address: request.ipAddress,
      user_agent: request.userAgent,
      assurance_level: user.session.assuranceLevel,
    })
    .eq('id', user.session.id)
    .is('revoked_at', null);

  if (updateResult.error && !isMissingWorkspaceTable(updateResult.error)) {
    console.error('Unable to refresh workspace session', updateResult.error.message);
  }
}

export async function recordSecurityEvent(input: SecurityEventInput) {
  const supabaseAdmin = getSupabaseAdminClient();
  const request = await getRequestMetadata();
  const { error } = await supabaseAdmin.from('workspace_security_events').insert({
    action: input.action,
    actor_user_id: input.actorUserId ?? null,
    target_user_id: input.targetUserId ?? null,
    target_email: safeString(input.targetEmail, 320) || null,
    session_id: input.sessionId ?? null,
    outcome: input.outcome ?? 'success',
    ip_address: request.ipAddress,
    user_agent: request.userAgent,
    metadata: input.metadata ?? {},
  });

  if (error && !isMissingWorkspaceTable(error)) {
    console.error('Unable to write workspace security event', error.message);
  }
}

export async function getWorkspaceUser(options?: {
  allowInactive?: boolean;
  touchSession?: boolean;
}): Promise<WorkspaceUser | null> {
  const supabase = await createSupabaseServerClient();
  const claimsResult = await supabase.auth.getClaims();

  if (claimsResult.error || !claimsResult.data?.claims) {
    return null;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const metadataRole = getMetadataRole(user);
  const member = await getMember(user);
  const role = member && isWorkspaceRole(member.role) ? member.role : metadataRole;

  if (!role || !member) return null;

  const memberStatus = isWorkspaceStatus(member.status)
    ? member.status
    : getMetadataStatus(user, role);
  const isBanned =
    Boolean(user.banned_until) &&
    new Date(String(user.banned_until)).getTime() > Date.now();
  const status = isBanned ? 'frozen' : memberStatus;
  const session = getSessionIdentity(claimsResult.data.claims as Record<string, unknown>);

  if (role === 'sales_exec' && !session.id) return null;
  if (!isSessionIssuedAfter(session.issuedAt, member.sessions_valid_after)) return null;

  if (session.id && (await getRevokedAt(session.id))) return null;
  if (!options?.allowInactive && status !== 'active') return null;
  if (options?.allowInactive && status === 'frozen') return null;

  const workspaceUser: WorkspaceUser = {
    id: user.id,
    email: member.email || user.email || '',
    displayName:
      member.display_name ||
      safeString(user.user_metadata?.full_name, 100) ||
      safeString(user.email?.split('@')[0], 100) ||
      'Luxa teammate',
    jobTitle: member.job_title || safeString(user.user_metadata?.job_title, 100) || null,
    role,
    status,
    mfaRequired: Boolean(member.mfa_required),
    session,
  };

  if (options?.touchSession !== false && status === 'active') {
    await touchWorkspaceSession(workspaceUser);
  }

  return workspaceUser;
}

export async function requireWorkspaceUser() {
  const user = await getWorkspaceUser();

  if (!user) throw new Error('Unauthorized');
  return user;
}

export async function requirePermission(permission: WorkspacePermission) {
  const user = await requireWorkspaceUser();

  if (!hasWorkspacePermission(user.role, permission)) {
    throw new Error('Forbidden');
  }

  return user;
}

export async function getDashboardIdentity(
  user?: WorkspaceUser,
): Promise<DashboardIdentity | null> {
  const workspaceUser = user ?? (await getWorkspaceUser());

  if (!workspaceUser) return null;

  return {
    id: workspaceUser.id,
    email: workspaceUser.email,
    displayName: workspaceUser.displayName,
    jobTitle: workspaceUser.jobTitle,
    role: workspaceUser.role,
    status: workspaceUser.status,
    mfaRequired: workspaceUser.mfaRequired,
    mfaEnabled: workspaceUser.session.assuranceLevel === 'aal2',
  };
}

export { isMissingWorkspaceTable };
