export const feedbackCategories = ['bug', 'feature'] as const;
export type FeedbackCategory = (typeof feedbackCategories)[number];

export const feedbackImpacts = [
  'blocking',
  'slowing_work',
  'improvement',
  'idea',
] as const;
export type FeedbackImpact = (typeof feedbackImpacts)[number];

export const feedbackStatuses = [
  'new',
  'reviewing',
  'planned',
  'resolved',
  'closed',
] as const;
export type FeedbackStatus = (typeof feedbackStatuses)[number];

export const feedbackCategoryLabels: Record<FeedbackCategory, string> = {
  bug: 'Bug',
  feature: 'Feature request',
};

export const feedbackImpactLabels: Record<FeedbackImpact, string> = {
  blocking: 'Blocks my work',
  slowing_work: 'Slows my work',
  improvement: 'Would improve my work',
  idea: 'Future idea',
};

export const feedbackStatusLabels: Record<FeedbackStatus, string> = {
  new: 'New',
  reviewing: 'Reviewing',
  planned: 'Planned',
  resolved: 'Resolved',
  closed: 'Closed',
};

export type FeedbackItem = {
  id: string;
  createdAt: string;
  updatedAt: string;
  submittedBy: string;
  submitterName: string;
  submitterEmail: string;
  category: FeedbackCategory;
  impact: FeedbackImpact;
  title: string;
  description: string;
  expectedOutcome: string | null;
  pagePath: string | null;
  status: FeedbackStatus;
  adminNote: string | null;
  reviewedAt: string | null;
};

export type FeedbackOverview = {
  items: FeedbackItem[];
  page: number;
  total: number;
  totalPages: number;
  metrics: {
    total: number;
    new: number;
    blocking: number;
    resolved: number;
  };
  dataReady: boolean;
};
