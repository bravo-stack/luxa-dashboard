import {
  icpCategories,
  type Lead,
  type LeadOrigin,
  type LeadPriority,
  type LeadStatus,
} from './types';

export const qualificationThreshold = 72;

export const statusLabels: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  won: 'Won',
  lost: 'Lost',
  spam: 'Spam',
};

export const originLabels: Record<LeadOrigin, string> = {
  website: 'Website',
  manual: 'Manual entry',
  import: 'Imported',
  integration: 'Integration',
};

export function getLeadOwnershipLabel(lead: Lead) {
  if (!lead.owner_user_id) {
    return 'Unassigned';
  }

  return lead.owner_user_id === lead.created_by ? 'Assigned to creator' : 'Assigned';
}

export const priorityLabels: Record<LeadPriority, string> = {
  standard: 'Standard',
  review_next: 'Review next',
  contact_overdue: 'Contact overdue',
  high_fit: 'High-fit lead',
};

export function getIcpCategoryLabel(value?: string) {
  if (!value) return 'Not classified';

  return icpCategories.find((category) => category.value === value)?.label ?? value;
}

export function isAwaitingReply(lead: Lead) {
  return lead.status === 'new' || lead.status === 'qualified';
}

export function isStaleLead(lead: Lead) {
  const createdAt = new Date(lead.created_at).getTime();
  const now = Date.now();
  const ageInHours = (now - createdAt) / (1000 * 60 * 60);

  return ageInHours >= 48 && lead.status === 'new';
}

export function isQualifiedLead(lead: Lead) {
  return lead.status === 'qualified' || lead.status === 'won';
}

export function isQualifiedNotScheduled(lead: Lead) {
  return lead.status === 'qualified';
}

export function isContactedWithoutNextStep(lead: Lead) {
  return lead.status === 'contacted';
}

export function getLeadPriority(lead: Lead): LeadPriority {
  if (lead.status === 'qualified') {
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
  const now = Date.now();
  const diffInHours = Math.max(1, Math.round((now - then) / (1000 * 60 * 60)));

  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  return `${Math.round(diffInHours / 24)}d ago`;
}

export function getEventLabel(eventType: string) {
  const labels: Record<string, string> = {
    quick_start_submitted: 'Quick-start submitted',
    lead_quick_start_submitted: 'Quick-start submitted',
    audit_submitted: 'Full audit submitted',
    lead_audit_submitted: 'Full audit submitted',
    lead_audit_started: 'Audit started',
    lead_audit_step_completed: 'Audit step completed',
    schedule_clicked: 'Schedule clicked',
    email_clicked: 'Email clicked',
    cta_clicked: 'CTA clicked',
    selected_work_clicked: 'Selected work clicked',
    pricing_clicked: 'Pricing clicked',
    page_viewed: 'Page viewed',
    dashboard_viewed: 'Dashboard viewed',
    status_changed: 'Status changed',
    lead_status_changed: 'Status changed',
    note_added: 'Note added',
    lead_note_added: 'Note added',
    proposal_sent: 'Proposal sent',
  };

  return labels[eventType] ?? eventType;
}
