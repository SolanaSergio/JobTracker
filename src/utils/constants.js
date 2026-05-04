import {
  LayoutDashboard, Search, Briefcase, Users, FileText, Settings as SettingsIcon,
  Calendar, ListChecks, BarChart3
} from 'lucide-react';

export const APP_STATUSES = [
  { key: 'saved',        label: 'Saved',        color: 'hsl(240 5% 60%)',  icon: '🔖', shortLabel: 'Saved' },
  { key: 'applied',      label: 'Applied',      color: 'hsl(217 92% 65%)', icon: '📤', shortLabel: 'Applied' },
  { key: 'phone_screen', label: 'Phone Screen', color: 'hsl(263 75% 65%)', icon: '📞', shortLabel: 'Phone' },
  { key: 'interview',    label: 'Interview',    color: 'hsl(38 92% 60%)',  icon: '🤝', shortLabel: 'Interview' },
  { key: 'offer',        label: 'Offer',        color: 'hsl(142 70% 50%)', icon: '🎉', shortLabel: 'Offer' },
  { key: 'closed',       label: 'Closed',       color: 'hsl(0 70% 55%)',   icon: '📁', shortLabel: 'Closed' },
];

export const STATUS_MAP = Object.fromEntries(APP_STATUSES.map(s => [s.key, s]));

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
  { key: 'all',    label: 'Any time' },
  { key: 'today',  label: '24 hours' },
  { key: '3days',  label: '3 days' },
  { key: 'week',   label: 'Past week' },
  { key: 'month',  label: 'Past month' },
];

export const TASK_PRIORITIES = [
  { key: 'low',    label: 'Low',    color: 'hsl(217 92% 65%)' },
  { key: 'normal', label: 'Normal', color: 'hsl(240 5% 60%)' },
  { key: 'high',   label: 'High',   color: 'hsl(38 92% 60%)' },
  { key: 'urgent', label: 'Urgent', color: 'hsl(0 70% 55%)' },
];

export const NAV_ITEMS = [
  { key: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard, group: 'main',   shortcut: 'g d' },
  { key: 'search',       label: 'Job Search',   icon: Search,          group: 'main',   shortcut: 'g s' },
  { key: 'applications', label: 'Applications', icon: Briefcase,       group: 'main',   shortcut: 'g a' },
  { key: 'calendar',     label: 'Calendar',     icon: Calendar,        group: 'main',   shortcut: 'g c' },
  { key: 'tasks',        label: 'Tasks',        icon: ListChecks,      group: 'main',   shortcut: 'g t' },
  { key: 'analytics',    label: 'Analytics',    icon: BarChart3,       group: 'main',   shortcut: 'g n' },
  { key: 'contacts',     label: 'Contacts',     icon: Users,           group: 'crm',    shortcut: 'g p' },
  { key: 'resumes',      label: 'Resumes',      icon: FileText,        group: 'crm',    shortcut: 'g r' },
  { key: 'settings',     label: 'Settings',     icon: SettingsIcon,    group: 'system', shortcut: 'g ,' },
];

export const MOBILE_NAV_ITEMS = ['dashboard', 'search', 'applications', 'calendar', 'tasks'];
