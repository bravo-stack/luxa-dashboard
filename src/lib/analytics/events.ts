export const posthogEventNames = [
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
  'dashboard_viewed',
  'lead_status_changed',
  'lead_note_added',
  'lead_exported',
] as const;

export type PosthogEventName = (typeof posthogEventNames)[number];

export const allowedAnalyticsProperties = [
  'lead_id',
  'route',
  'source',
  'cta_label',
  'project_type',
  'industry_segment',
  'budget_range',
  'timeline',
  'decision_stage',
  'submission_type',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'step',
] as const;

export type AllowedAnalyticsProperty = (typeof allowedAnalyticsProperties)[number];

export type AnalyticsProperties = Partial<
  Record<AllowedAnalyticsProperty, string | number | boolean | null>
>;

export function sanitizeAnalyticsProperties(
  properties: Record<string, string | number | boolean | null | undefined>,
): AnalyticsProperties {
  return allowedAnalyticsProperties.reduce<AnalyticsProperties>((safeProperties, key) => {
    const value = properties[key];

    if (value !== undefined) {
      safeProperties[key] = value;
    }

    return safeProperties;
  }, {});
}
