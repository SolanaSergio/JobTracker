import { format, formatDistanceToNowStrict, isToday, isTomorrow, isYesterday, parseISO, isValid } from 'date-fns';

const safeDate = (input) => {
  if (!input) return null;
  if (input instanceof Date) return isValid(input) ? input : null;
  const d = typeof input === 'string' ? parseISO(input) : new Date(input);
  return isValid(d) ? d : null;
};

export function generateId() {
  return crypto.randomUUID();
}

export function formatDate(input, fmt = 'MMM d, yyyy') {
  const d = safeDate(input);
  return d ? format(d, fmt) : '—';
}

export function formatDateTime(input) {
  const d = safeDate(input);
  return d ? format(d, "MMM d, yyyy 'at' h:mm a") : '—';
}

export function formatRelative(input) {
  const d = safeDate(input);
  if (!d) return '';
  if (isToday(d)) return `Today, ${format(d, 'h:mm a')}`;
  if (isTomorrow(d)) return `Tomorrow, ${format(d, 'h:mm a')}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, 'h:mm a')}`;
  return format(d, "MMM d, h:mm a");
}

export function timeAgo(input) {
  const d = safeDate(input);
  if (!d) return '';
  return formatDistanceToNowStrict(d, { addSuffix: true });
}

export function formatSalary(min, max) {
  const fmt = (n) => {
    if (!n) return null;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
    return `$${n}`;
  };
  const a = fmt(min), b = fmt(max);
  if (a && b) return a === b ? a : `${a} – ${b}`;
  if (a) return `${a}+`;
  if (b) return `Up to ${b}`;
  return null;
}

export function truncate(str, len = 100) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function extractCity(location) {
  if (!location) return '';
  return location.split(',')[0].trim();
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export function pluralize(n, singular, plural) {
  return n === 1 ? `${n} ${singular}` : `${n} ${plural || singular + 's'}`;
}

export function calcStreak(items, dateField = 'created_at') {
  if (!items?.length) return 0;
  const days = new Set(
    items
      .map(i => safeDate(i[dateField]))
      .filter(Boolean)
      .map(d => format(d, 'yyyy-MM-dd'))
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = format(d, 'yyyy-MM-dd');
    if (days.has(k)) streak++;
    else if (i > 0) break;
  }
  return streak;
}

export function groupBy(items, fn) {
  const map = new Map();
  for (const item of items || []) {
    const k = fn(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(item);
  }
  return map;
}
