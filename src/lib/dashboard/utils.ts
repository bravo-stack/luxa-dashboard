import {
  auditSubmissions,
  dashboardNow,
  leadEvents,
  leadNotes,
  leadOwners,
} from './mock-data';
import type { Lead, LeadOwner, LeadPriority, LeadStatus } from './types';

export const qualificationThreshold = 72;

export const statusLabels: Record<LeadStatus, string> = {
  new: 'New',
  qualified: 'Qualified',
  contacted: 'Contacted',
  scheduled: 'Scheduled',
  proposal_ready: 'Proposal ready',
  won: 'Won',
  lost: 'Lost',
  archived: 'Archived',
};

export const priorityLabels: Record<LeadPriority, string> = {
  standard: 'Standard',
  review_next: 'Review next',
  contact_overdue: 'Contact overdue',
  high_fit: 'High-fit lead',
};

export function getLeadOwner(lead: Lead): LeadOwner | undefined {
  return leadOwners.find((owner) => owner.id === lead.owner_user_id);
}

export function isAwaitingReply(lead: Lead) {
  return (
    (lead.status === 'new' || lead.status === 'qualified') && !lead.last_contacted_at
  );
}

export function isStaleLead(lead: Lead) {
  const createdAt = new Date(lead.created_at).getTime();
  const now = new Date(dashboardNow).getTime();
  const ageInHours = (now - createdAt) / (1000 * 60 * 60);

  return ageInHours >= 48 && !lead.last_contacted_at;
}

export function isQualifiedLead(lead: Lead) {
  return lead.qualification_score >= qualificationThreshold;
}

export function isQualifiedNotScheduled(lead: Lead) {
  return (
    isQualifiedLead(lead) &&
    !['scheduled', 'proposal_ready', 'won', 'lost', 'archived'].includes(lead.status)
  );
}

export function isContactedWithoutNextStep(lead: Lead) {
  return lead.status === 'contacted' && Boolean(lead.last_contacted_at);
}

export function getLeadPriority(lead: Lead): LeadPriority {
  if (lead.qualification_score >= 90 && !lead.last_contacted_at) {
    return 'high_fit';
  }

  if (isStaleLead(lead)) {
    return 'contact_overdue';
  }

  if (isQualifiedNotScheduled(lead)) {
    return 'review_next';
  }

  return 'standard';
}

export function getLeadSubmissions(leadId: string) {
  return auditSubmissions
    .filter((submission) => submission.lead_id === leadId)
    .sort(
      (first, second) =>
        new Date(second.created_at).getTime() - new Date(first.created_at).getTime(),
    );
}

export function getLeadEvents(leadId: string) {
  return leadEvents
    .filter((event) => event.lead_id === leadId)
    .sort(
      (first, second) =>
        new Date(second.created_at).getTime() - new Date(first.created_at).getTime(),
    );
}

export function getLeadNotes(leadId: string) {
  return leadNotes
    .filter((note) => note.lead_id === leadId)
    .sort(
      (first, second) =>
        new Date(second.created_at).getTime() - new Date(first.created_at).getTime(),
    );
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatRelativeTime(value: string | null) {
  if (!value) {
    return 'No contact yet';
  }

  const then = new Date(value).getTime();
  const now = new Date(dashboardNow).getTime();
  const diffInHours = Math.max(1, Math.round((now - then) / (1000 * 60 * 60)));

  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  return `${Math.round(diffInHours / 24)}d ago`;
}

export function getEventLabel(eventType: string) {
  const labels: Record<string, string> = {
    quick_start_submitted: 'Quick-start submitted',
    audit_submitted: 'Full audit submitted',
    schedule_clicked: 'Schedule clicked',
    email_clicked: 'Email clicked',
    status_changed: 'Status changed',
    note_added: 'Note added',
    proposal_sent: 'Proposal sent',
  };

  return labels[eventType] ?? eventType;
}
