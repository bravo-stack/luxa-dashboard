import 'server-only';

import { getSupabaseAdminClient } from '@/lib/supabase/admin';

import { isWorkspaceRole, isWorkspaceStatus } from './policy';
import type { WorkspaceRole, WorkspaceStatus, WorkspaceUser } from './types';
import { isMissingWorkspaceTable, requirePermission } from './workspace';

type MemberRow = {
  user_id: string;
  email: string;
  display_name: string;
  job_title: string | null;
  role: string;
  status: string;
  invited_at: string | null;
  accepted_at: string | null;
  frozen_at: string | null;
  freeze_reason: string | null;
  sessions_valid_after: string;
  mfa_required: boolean;
};

type SessionRow = {
  id: string;
  user_id: string;
  first_seen_at: string;
  last_seen_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  assurance_level: 'aal1' | 'aal2';
};

type EventRow = {
  id: string;
  created_at: string;
  actor_user_id: string | null;
  target_user_id: string | null;
  target_email: string | null;
  session_id: string | null;
  action: string;
  outcome: 'success' | 'denied' | 'failed';
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
};

type LeadPerformanceRow = {
  owner_user_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type NotePerformanceRow = {
  created_by: string | null;
  created_at: string;
};

export type MemberPerformance = {
  assigned: number;
  open: number;
  qualified: number;
  won: number;
  overdue: number;
  notesLast7Days: number;
  conversionRate: number;
  followUpHealth: number;
};

export type TeamMemberOverview = {
  id: string;
  email: string;
  displayName: string;
  jobTitle: string | null;
  role: WorkspaceRole;
  status: WorkspaceStatus;
  invitedAt: string | null;
  acceptedAt: string | null;
  lastSignInAt: string | null;
  frozenAt: string | null;
  freezeReason: string | null;
  activeSessions: number;
  mfaEnabled: boolean;
  mfaRequired: boolean;
  performance: MemberPerformance;
};

export type WorkspaceSessionOverview = {
  id: string;
  userId: string;
  memberName: string;
  memberEmail: string;
  firstSeenAt: string;
  lastSeenAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  assuranceLevel: 'aal1' | 'aal2';
};

export type SecurityEventOverview = {
  id: string;
  createdAt: string;
  actorName: string;
  targetName: string;
  targetEmail: string | null;
  action: string;
  outcome: 'success' | 'denied' | 'failed';
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
};

export type TeamAccessOverview = {
  members: TeamMemberOverview[];
  sessions: WorkspaceSessionOverview[];
  events: SecurityEventOverview[];
  metrics: {
    activeMembers: number;
    pendingInvites: number;
    frozenMembers: number;
    activeSessions: number;
    mfaCoverage: number;
    unassignedLeads: number;
  };
  dataReady: boolean;
};

export type SalesLeadNoteActivity = {
  id: string;
  leadId: string;
  createdAt: string;
};

function emptyPerformance(): MemberPerformance {
  return {
    assigned: 0,
    open: 0,
    qualified: 0,
    won: 0,
    overdue: 0,
    notesLast7Days: 0,
    conversionRate: 0,
    followUpHealth: 100,
  };
}

function isActiveSession(session: SessionRow) {
  return (
    !session.revoked_at &&
    (!session.expires_at || new Date(session.expires_at).getTime() > Date.now())
  );
}

function getMemberStatus(
  member: MemberRow | undefined,
  fallback: unknown,
  bannedUntil: string | undefined,
  role: WorkspaceRole,
): WorkspaceStatus {
  if (bannedUntil && new Date(bannedUntil).getTime() > Date.now()) return 'frozen';
  if (member && isWorkspaceStatus(member.status)) return member.status;
  if (isWorkspaceStatus(fallback)) return fallback;
  return role === 'admin' ? 'active' : 'invited';
}

async function loadAccessTables() {
  const supabaseAdmin = getSupabaseAdminClient();
  const [membersResult, sessionsResult, eventsResult, leadsResult, notesResult] =
    await Promise.all([
      supabaseAdmin
        .from('workspace_members')
        .select(
          'user_id,email,display_name,job_title,role,status,invited_at,accepted_at,frozen_at,freeze_reason,sessions_valid_after,mfa_required',
        ),
      supabaseAdmin
        .from('workspace_sessions')
        .select(
          'id,user_id,first_seen_at,last_seen_at,expires_at,revoked_at,ip_address,user_agent,assurance_level',
        )
        .order('last_seen_at', { ascending: false })
        .limit(250),
      supabaseAdmin
        .from('workspace_security_events')
        .select(
          'id,created_at,actor_user_id,target_user_id,target_email,session_id,action,outcome,ip_address,user_agent,metadata',
        )
        .order('created_at', { ascending: false })
        .limit(100),
      supabaseAdmin
        .from('lead_submissions')
        .select('owner_user_id,status,created_at,updated_at')
        .limit(10_000),
      supabaseAdmin
        .from('lead_submission_notes')
        .select('created_by,created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1_000).toISOString())
        .limit(10_000),
    ]);

  const accessTableErrors = [
    membersResult.error,
    sessionsResult.error,
    eventsResult.error,
  ].filter(Boolean);
  const dataReady = !accessTableErrors.some((error) => isMissingWorkspaceTable(error));

  if (membersResult.error && !isMissingWorkspaceTable(membersResult.error)) {
    throw new Error(`Workspace member query failed: ${membersResult.error.message}`);
  }
  if (sessionsResult.error && !isMissingWorkspaceTable(sessionsResult.error)) {
    throw new Error(`Workspace session query failed: ${sessionsResult.error.message}`);
  }
  if (eventsResult.error && !isMissingWorkspaceTable(eventsResult.error)) {
    throw new Error(
      `Workspace security event query failed: ${eventsResult.error.message}`,
    );
  }
  if (leadsResult.error) {
    throw new Error(`Lead performance query failed: ${leadsResult.error.message}`);
  }
  if (notesResult.error) {
    throw new Error(`Lead activity query failed: ${notesResult.error.message}`);
  }

  return {
    members: (membersResult.data ?? []) as MemberRow[],
    sessions: (sessionsResult.data ?? []) as SessionRow[],
    events: (eventsResult.data ?? []) as EventRow[],
    leads: (leadsResult.data ?? []) as LeadPerformanceRow[],
    notes: (notesResult.data ?? []) as NotePerformanceRow[],
    dataReady,
  };
}

export async function getTeamAccessOverview(): Promise<TeamAccessOverview> {
  await requirePermission('members.manage');
  const supabaseAdmin = getSupabaseAdminClient();

  const [authResult, accessData] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    loadAccessTables(),
  ]);

  if (authResult.error) {
    throw new Error(`Supabase user query failed: ${authResult.error.message}`);
  }

  const memberRows = new Map(
    accessData.members.map((member) => [member.user_id, member]),
  );
  const workspaceAuthUsers = authResult.data.users.filter((user) => {
    const memberRole = memberRows.get(user.id)?.role;
    return isWorkspaceRole(memberRole) || isWorkspaceRole(user.app_metadata?.role);
  });
  const mfaResults = await Promise.all(
    workspaceAuthUsers.map(async (user) => {
      const { data } = await supabaseAdmin.auth.admin.mfa.listFactors({
        userId: user.id,
      });

      return [
        user.id,
        Boolean(data?.factors.some((factor) => factor.status === 'verified')),
      ] as const;
    }),
  );
  const mfaByUser = new Map(mfaResults);
  const sessionsByUser = new Map<string, SessionRow[]>();

  accessData.sessions.forEach((session) => {
    sessionsByUser.set(session.user_id, [
      ...(sessionsByUser.get(session.user_id) ?? []),
      session,
    ]);
  });

  const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1_000;
  const memberOverviews = workspaceAuthUsers
    .map((authUser): TeamMemberOverview | null => {
      const member = memberRows.get(authUser.id);
      const roleValue = member?.role ?? authUser.app_metadata?.role;

      if (!isWorkspaceRole(roleValue)) return null;

      const userLeads = accessData.leads.filter(
        (lead) => lead.owner_user_id === authUser.id,
      );
      const openLeads = userLeads.filter(
        (lead) => !['won', 'lost', 'spam'].includes(lead.status),
      );
      const won = userLeads.filter((lead) => lead.status === 'won').length;
      const overdue = openLeads.filter(
        (lead) => new Date(lead.updated_at).getTime() < twoDaysAgo,
      ).length;
      const userSessions = sessionsByUser.get(authUser.id) ?? [];
      const performance = emptyPerformance();

      performance.assigned = userLeads.length;
      performance.open = openLeads.length;
      performance.qualified = userLeads.filter(
        (lead) => lead.status === 'qualified',
      ).length;
      performance.won = won;
      performance.overdue = overdue;
      performance.notesLast7Days = accessData.notes.filter(
        (note) => note.created_by === authUser.id,
      ).length;
      performance.conversionRate = userLeads.length
        ? Math.round((won / userLeads.length) * 100)
        : 0;
      performance.followUpHealth = openLeads.length
        ? Math.round(((openLeads.length - overdue) / openLeads.length) * 100)
        : 100;

      return {
        id: authUser.id,
        email: member?.email ?? authUser.email ?? '',
        displayName:
          member?.display_name ||
          String(authUser.user_metadata?.full_name ?? '').trim() ||
          authUser.email?.split('@')[0] ||
          'Luxa teammate',
        jobTitle:
          member?.job_title || String(authUser.user_metadata?.job_title ?? '') || null,
        role: roleValue,
        status: getMemberStatus(
          member,
          authUser.app_metadata?.account_status,
          authUser.banned_until,
          roleValue,
        ),
        invitedAt: member?.invited_at ?? authUser.invited_at ?? null,
        acceptedAt: member?.accepted_at ?? authUser.email_confirmed_at ?? null,
        lastSignInAt: authUser.last_sign_in_at ?? null,
        frozenAt: member?.frozen_at ?? null,
        freezeReason: member?.freeze_reason ?? null,
        activeSessions: userSessions.filter(isActiveSession).length,
        mfaEnabled: mfaByUser.get(authUser.id) ?? false,
        mfaRequired: member?.mfa_required ?? false,
        performance,
      };
    })
    .filter(Boolean) as TeamMemberOverview[];

  const memberById = new Map(memberOverviews.map((member) => [member.id, member]));
  const sessions = accessData.sessions.map((session): WorkspaceSessionOverview => ({
    id: session.id,
    userId: session.user_id,
    memberName: memberById.get(session.user_id)?.displayName ?? 'Former teammate',
    memberEmail: memberById.get(session.user_id)?.email ?? '',
    firstSeenAt: session.first_seen_at,
    lastSeenAt: session.last_seen_at,
    expiresAt: session.expires_at,
    revokedAt: session.revoked_at,
    ipAddress: session.ip_address,
    userAgent: session.user_agent,
    assuranceLevel: session.assurance_level,
  }));
  const events = accessData.events.map((event): SecurityEventOverview => ({
    id: event.id,
    createdAt: event.created_at,
    actorName: event.actor_user_id
      ? (memberById.get(event.actor_user_id)?.displayName ?? 'System')
      : 'System',
    targetName: event.target_user_id
      ? (memberById.get(event.target_user_id)?.displayName ?? 'Former teammate')
      : event.target_email || 'Unknown account',
    targetEmail: event.target_email,
    action: event.action,
    outcome: event.outcome,
    ipAddress: event.ip_address,
    userAgent: event.user_agent,
    metadata: event.metadata ?? {},
  }));
  const salesMembers = memberOverviews.filter((member) => member.role === 'sales_exec');
  const mfaEnabledCount = memberOverviews.filter((member) => member.mfaEnabled).length;

  return {
    members: memberOverviews.sort((first, second) =>
      first.displayName.localeCompare(second.displayName),
    ),
    sessions,
    events,
    metrics: {
      activeMembers: memberOverviews.filter((member) => member.status === 'active')
        .length,
      pendingInvites: memberOverviews.filter((member) => member.status === 'invited')
        .length,
      frozenMembers: memberOverviews.filter((member) => member.status === 'frozen')
        .length,
      activeSessions: sessions.filter(
        (session) =>
          !session.revokedAt &&
          (!session.expiresAt || new Date(session.expiresAt).getTime() > Date.now()),
      ).length,
      mfaCoverage: memberOverviews.length
        ? Math.round((mfaEnabledCount / memberOverviews.length) * 100)
        : 0,
      unassignedLeads: accessData.leads.filter((lead) => !lead.owner_user_id).length,
    },
    dataReady: accessData.dataReady,
  };
}

export async function getAccountSecurityOverview(user: WorkspaceUser) {
  const supabaseAdmin = getSupabaseAdminClient();
  const [sessionsResult, eventsResult] = await Promise.all([
    supabaseAdmin
      .from('workspace_sessions')
      .select(
        'id,user_id,first_seen_at,last_seen_at,expires_at,revoked_at,ip_address,user_agent,assurance_level',
      )
      .eq('user_id', user.id)
      .order('last_seen_at', { ascending: false })
      .limit(20),
    supabaseAdmin
      .from('workspace_security_events')
      .select(
        'id,created_at,actor_user_id,target_user_id,target_email,session_id,action,outcome,ip_address,user_agent,metadata',
      )
      .eq('target_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const sessions = (sessionsResult.data ?? []) as SessionRow[];
  const events = (eventsResult.data ?? []) as EventRow[];

  return {
    activeSessions: sessions.filter(isActiveSession).length,
    sessions: sessions.map((session): WorkspaceSessionOverview => ({
      id: session.id,
      userId: session.user_id,
      memberName: user.displayName,
      memberEmail: user.email,
      firstSeenAt: session.first_seen_at,
      lastSeenAt: session.last_seen_at,
      expiresAt: session.expires_at,
      revokedAt: session.revoked_at,
      ipAddress: session.ip_address,
      userAgent: session.user_agent,
      assuranceLevel: session.assurance_level,
    })),
    events: events.map((event): SecurityEventOverview => ({
      id: event.id,
      createdAt: event.created_at,
      actorName: event.actor_user_id === user.id ? user.displayName : 'Administrator',
      targetName: user.displayName,
      targetEmail: user.email,
      action: event.action,
      outcome: event.outcome,
      ipAddress: event.ip_address,
      userAgent: event.user_agent,
      metadata: event.metadata ?? {},
    })),
  };
}

export async function getAssignableSalesExecutives() {
  await requirePermission('leads.assign');
  const supabaseAdmin = getSupabaseAdminClient();

  const { data, error } = await supabaseAdmin
    .from('workspace_members')
    .select('user_id,display_name,email,status')
    .eq('role', 'sales_exec')
    .eq('status', 'active')
    .order('display_name', { ascending: true });

  if (error) {
    if (isMissingWorkspaceTable(error)) return [];
    throw new Error(`Assignable member query failed: ${error.message}`);
  }

  return (data ?? []).map((member) => ({
    id: String(member.user_id),
    displayName: String(member.display_name),
    email: String(member.email),
  }));
}

export async function getSalesLeadCreators() {
  await requirePermission('leads.read_all');
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('workspace_members')
    .select('user_id,display_name,email,status')
    .eq('role', 'sales_exec')
    .order('display_name', { ascending: true });

  if (error) {
    if (isMissingWorkspaceTable(error)) return [];
    throw new Error(`Sales lead creator query failed: ${error.message}`);
  }

  return (data ?? []).flatMap((member) => {
    if (!isWorkspaceStatus(member.status)) return [];

    return [
      {
        id: String(member.user_id),
        displayName: String(member.display_name),
        email: String(member.email),
        status: member.status,
      },
    ];
  });
}

export async function getWorkspaceMemberRole(userId: string) {
  await requirePermission('leads.read_all');
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('workspace_members')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (isMissingWorkspaceTable(error)) return null;
    throw new Error(`Workspace member role query failed: ${error.message}`);
  }

  return isWorkspaceRole(data?.role) ? data.role : null;
}

export async function getSalesExecutiveLeadNoteActivity(userId: string) {
  await requirePermission('members.manage');
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('lead_submission_notes')
    .select('id,lead_id,created_at')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Sales lead activity query failed: ${error.message}`);
  }

  return (data ?? []).map((item): SalesLeadNoteActivity => ({
    id: String(item.id),
    leadId: String(item.lead_id),
    createdAt: String(item.created_at),
  }));
}
