import type { AnalyticsEventName } from './events';

export const primaryAuditFunnelSteps = [
  { type: 'path', value: '/audit' },
  { type: 'event', value: 'lead_audit_started' },
  { type: 'event', value: 'lead_audit_submitted' },
] as const;

export const legacyAuditFunnelSteps = [
  { type: 'path', value: '/audit' },
  { type: 'event', value: 'lead_form_started' },
  { type: 'event', value: 'lead_form_submitted' },
] as const;

export const publicSiteEventNames = [
  'page_viewed',
  'cta_clicked',
  'lead_quick_start_started',
  'lead_quick_start_submitted',
  'lead_audit_started',
  'lead_audit_step_completed',
  'lead_audit_submitted',
  'schedule_clicked',
  'email_clicked',
  'selected_work_clicked',
  'pricing_clicked',
] as const satisfies readonly AnalyticsEventName[];

export const leadStartEventNames = [
  'lead_quick_start_started',
  'lead_audit_started',
] as const satisfies readonly AnalyticsEventName[];

export const leadSubmissionEventNames = [
  'lead_quick_start_submitted',
  'lead_audit_submitted',
] as const satisfies readonly AnalyticsEventName[];

const exactPublicPaths = new Set([
  '/',
  '/solutions',
  '/case-studies',
  '/pricing',
  '/audit',
  '/book-call',
  '/about',
]);

export function normalizePublicPath(value: string) {
  const input = value.trim();

  if (!input) return null;

  try {
    const pathname =
      input.startsWith('http://') || input.startsWith('https://')
        ? new URL(input).pathname
        : input.split(/[?#]/, 1)[0];

    if (!pathname?.startsWith('/')) return null;

    return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  } catch {
    return null;
  }
}

export function isCurrentPublicPath(value: string) {
  const pathname = normalizePublicPath(value);

  if (!pathname) return false;
  if (exactPublicPaths.has(pathname)) return true;

  return (
    /^\/case-studies\/[^/]+$/.test(pathname) || /^\/industries\/[^/]+$/.test(pathname)
  );
}
