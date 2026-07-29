import type { LeadStatus } from '../dashboard/types';

export type LeadStatusDefinition = {
  status: LeadStatus;
  label: string;
  summary: string;
  useWhen: string;
  nextAction: string;
  exitCriteria: string;
};

export const leadStatusDefinitions: readonly LeadStatusDefinition[] = [
  {
    status: 'new',
    label: 'New',
    summary: 'Unreviewed or not yet worked by its owner.',
    useWhen:
      'The lead has entered the workspace, but fit, contact data, ownership, and the first outreach plan have not all been reviewed.',
    nextAction:
      'Validate the record, confirm ownership and fit, then make the first relevant outreach with a dated follow-up.',
    exitCriteria:
      'Move to Contacted after a real outreach attempt is logged. Use Spam only for invalid or abusive submissions.',
  },
  {
    status: 'contacted',
    label: 'Contacted',
    summary: 'Outreach has started; discovery or a response is still needed.',
    useWhen:
      'A representative has made a genuine, relevant outreach attempt and recorded the channel, date, and next action.',
    nextAction:
      'Continue a purposeful cadence, capture each response, and agree a concrete next step with an owner and date.',
    exitCriteria:
      'Move to Qualified when there is evidence of fit, need, stakeholders, and a credible buying path.',
  },
  {
    status: 'qualified',
    label: 'Qualified',
    summary: 'A credible opportunity with enough evidence to invest sales time.',
    useWhen:
      'Need and fit are clear, the buying group is understood, and budget confidence, priority, and timing have been explored.',
    nextAction:
      'Advance discovery, involve the right stakeholders, and maintain a prospect-agreed next commitment.',
    exitCriteria:
      'Move to Won after a commercial commitment, or Lost when the current buying motion has ended. Record the outcome reason.',
  },
  {
    status: 'won',
    label: 'Won',
    summary: 'The prospect has made the agreed commercial commitment.',
    useWhen:
      'The engagement is confirmed through the organization’s accepted commercial signal, such as a signed agreement or received payment.',
    nextAction:
      'Record why the deal was won, complete the handoff, and preserve stakeholder, scope, and expectation context.',
    exitCriteria:
      'This is a closed status. Reopen only when the original outcome was recorded in error.',
  },
  {
    status: 'lost',
    label: 'Lost',
    summary: 'A real opportunity is not proceeding in the current buying motion.',
    useWhen:
      'The prospect chose another option, timing or priority ended, fit failed, or the opportunity became commercially unviable.',
    nextAction:
      'Record a specific loss reason and useful context. Set a future reminder only when the prospect gave a credible revisit point.',
    exitCriteria:
      'This is a closed status. Reopen only when a new, active buying motion begins.',
  },
  {
    status: 'spam',
    label: 'Spam',
    summary: 'Invalid, irrelevant, duplicate abuse, or malicious traffic.',
    useWhen:
      'The submission is clearly not a legitimate sales lead. Do not use Spam for a valid prospect who is merely not ready.',
    nextAction:
      'Record the reason, suppress unnecessary follow-up, and preserve the classification for data-quality review.',
    exitCriteria:
      'This is a closed status. Restore only when the classification was incorrect.',
  },
] as const;

export function getLeadStatusDefinition(status: LeadStatus): LeadStatusDefinition {
  const definition = leadStatusDefinitions.find((item) => item.status === status);

  if (!definition) {
    throw new Error(`Missing sales playbook definition for ${status}`);
  }

  return definition;
}
