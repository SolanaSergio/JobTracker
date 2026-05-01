export const APP_STATUSES = [
  { key: 'saved', label: 'Saved', color: '#64748b', icon: '🔖' },
  { key: 'applied', label: 'Applied', color: '#3b82f6', icon: '📤' },
  { key: 'phone_screen', label: 'Phone Screen', color: '#8b5cf6', icon: '📞' },
  { key: 'interview', label: 'Interview', color: '#f59e0b', icon: '🤝' },
  { key: 'offer', label: 'Offer', color: '#10b981', icon: '🎉' },
  { key: 'closed', label: 'Closed', color: '#ef4444', icon: '📁' },
];

export const CLOSE_REASONS = ['accepted', 'rejected', 'withdrawn', 'no_response'];

export const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'temporary', 'internship'];

export const WORK_MODES = ['on-site', 'remote', 'hybrid'];

export const CALL_OUTCOMES = ['connected', 'voicemail', 'no_answer', 'callback_scheduled', 'wrong_number'];

export const SUBMISSION_METHODS = ['online_portal', 'email', 'in_person', 'recruiter', 'referral'];

export const SUBMISSION_STATUSES = ['sent', 'viewed', 'acknowledged', 'no_response'];

export const JOB_CATEGORIES = [
  'HVAC', 'Plumbing', 'Electrical', 'Construction', 'Maintenance',
  'Software Engineering', 'Data Science', 'IT Support', 'Cybersecurity',
  'Healthcare', 'Nursing', 'Sales', 'Marketing', 'Finance', 'Accounting',
  'Customer Service', 'Logistics', 'Warehouse', 'Manufacturing',
  'Education', 'Legal', 'Design', 'Engineering', 'Management', 'Other'
];

export const DATE_FILTERS = [
  { key: 'all', label: 'Any time' },
  { key: 'today', label: 'Past 24 hours' },
  { key: '3days', label: 'Past 3 days' },
  { key: 'week', label: 'Past week' },
  { key: 'month', label: 'Past month' },
];

export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'search', label: 'Job Search', icon: '🔍' },
  { key: 'applications', label: 'Applications', icon: '📋' },
  { key: 'contacts', label: 'Contacts', icon: '👥' },
  { key: 'resumes', label: 'Resumes', icon: '📄' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
];
