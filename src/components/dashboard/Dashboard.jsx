import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase, TrendingUp, Trophy, Flame, ArrowUpRight, Plus, Search as SearchIcon,
  Calendar, Clock, ExternalLink, ArrowRight, Sparkles
} from 'lucide-react';
import { format, isAfter, isToday, isWithinInterval, addDays } from 'date-fns';
import { Area, AreaChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useApp } from '../../lib/app-context';
import { APP_STATUSES, STATUS_MAP } from '../../utils/constants';
import { calcStreak, formatRelative, timeAgo } from '../../utils/helpers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { EmptyState, Skeleton } from '../ui/feedback';

export default function Dashboard() {
  const configured = isSupabaseConfigured();
  const { navigate, setQuickAddOpen } = useApp();
  const { data: apps, loading } = useSupabaseQuery('applications');
  const { data: events } = useSupabaseQuery('events', { orderBy: 'starts_at', ascending: true });
  const { data: tasks } = useSupabaseQuery('tasks');
  const { data: activities } = useSupabaseQuery('activity_log', { orderBy: 'created_at', ascending: false });
  const { data: contacts } = useSupabaseQuery('contacts');

  if (!configured) return <SetupPrompt onNavigate={navigate} />;
  if (loading && apps.length === 0) return <DashboardSkeleton />;

  return <DashboardContent apps={apps} events={events} tasks={tasks} activities={activities} contacts={contacts} navigate={navigate} setQuickAddOpen={setQuickAddOpen} />;
}

function DashboardContent({ apps, events, tasks, activities, contacts, navigate, setQuickAddOpen }) {
  const stats = useMemo(() => computeStats(apps), [apps]);
  const sparkData = useMemo(() => buildWeeklyTrend(apps), [apps]);
  const upcoming = useMemo(() => buildUpcoming(apps, events), [apps, events]);
  const openTasks = (tasks || []).filter((t) => !t.completed_at).slice(0, 5);
  const streak = useMemo(() => calcStreak(apps), [apps]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto w-full">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-[var(--muted-foreground)]">{greeting}, here's where you stand today.</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1">Career pipeline</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('search')} className="hidden sm:inline-flex"><SearchIcon className="h-4 w-4" />Search jobs</Button>
            <Button onClick={() => setQuickAddOpen(true)}><Plus className="h-4 w-4" />Add</Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard icon={Briefcase} label="Active apps" value={stats.active} hint={`${stats.total} total`} accent="info" />
        <StatCard icon={TrendingUp} label="Interview rate" value={`${stats.interviewRate}%`} hint={`${stats.interviews} interviews`} accent="primary" />
        <StatCard icon={Trophy} label="Offers" value={stats.offers} hint={`${stats.offerRate}% conversion`} accent="success" />
        <StatCard icon={Flame} label="Daily streak" value={streak} hint={streak === 1 ? 'day in a row' : 'days in a row'} accent="warning" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Trend chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Application activity</CardTitle>
              <CardDescription>Last 14 days</CardDescription>
            </div>
            <Badge variant="outline">{sparkData.reduce((s, d) => s + d.count, 0)} this period</Badge>
          </CardHeader>
          <CardContent className="h-56 sm:h-64 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="g-apps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <YAxis hide />
                <ChartTooltip cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} content={<ChartTooltipBox />} />
                <Area type="monotone" dataKey="count" stroke="var(--chart-1)" strokeWidth={2} fill="url(#g-apps)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline</CardTitle>
            <CardDescription>By status</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {APP_STATUSES.map((s) => {
              const count = stats.byStatus[s.key] || 0;
              const pct = stats.total ? (count / stats.total) * 100 : 0;
              return (
                <div key={s.key} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full status-${s.key} status-bar`} />{s.label}</span>
                    <span className="text-[var(--muted-foreground)]">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, delay: 0.05 }} className={`h-full status-${s.key} status-bar`} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Upcoming */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Calendar className="h-4 w-4 text-[var(--primary)]" />Upcoming</CardTitle>
              <CardDescription>Interviews and follow-ups in the next 7 days</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('calendar')}>View all <ArrowRight className="h-3.5 w-3.5" /></Button>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <EmptyState icon={Calendar} title="No upcoming events" description="Add an interview or follow-up to track it here." action={<Button size="sm" onClick={() => setQuickAddOpen(true)}><Plus className="h-3.5 w-3.5" />Add event</Button>} />
            ) : (
              <ul className="flex flex-col gap-2">
                {upcoming.map((u) => (
                  <li key={u.id} className="group flex items-center gap-3 rounded-lg border border-transparent hover:border-[var(--border)] hover:bg-[var(--accent)] p-3 transition-colors">
                    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-[var(--secondary)] text-[var(--foreground)]">
                      <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">{format(u.date, 'MMM')}</span>
                      <span className="text-sm font-bold leading-none">{format(u.date, 'd')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{u.title}</div>
                      <div className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5"><Clock className="h-3 w-3" />{format(u.date, 'EEE, h:mm a')}{u.subtitle && <> · <span className="truncate">{u.subtitle}</span></>}</div>
                    </div>
                    {u.kind && <Badge variant="outline" className="shrink-0">{u.kind}</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>{openTasks.length} open</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('tasks')}>Open<ArrowRight className="h-3.5 w-3.5" /></Button>
          </CardHeader>
          <CardContent>
            {openTasks.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No open tasks. <button className="text-[var(--primary)] hover:underline" onClick={() => setQuickAddOpen(true)}>Add one</button>.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {openTasks.map((t) => (
                  <li key={t.id} className="text-sm flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--primary)] shrink-0" />
                    <div className="min-w-0">
                      <div className="truncate">{t.title}</div>
                      {t.due_date && <div className="text-xs text-[var(--muted-foreground)]">{formatRelative(t.due_date)}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>What you've been working on</CardDescription>
            </div>
            <Badge variant="outline">{contacts?.length || 0} contacts</Badge>
          </CardHeader>
          <CardContent>
            {(activities || []).length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">Nothing to show yet — start by saving a job.</p>
            ) : (
              <ol className="relative pl-6 border-l border-[var(--border)] flex flex-col gap-4">
                {(activities || []).slice(0, 6).map((a) => (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--primary)] ring-4 ring-[var(--background)]" />
                    <div className="text-sm leading-tight">{a.description}</div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{timeAgo(a.created_at)}</div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChartTooltipBox({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--popover)] px-2.5 py-1.5 text-xs shadow-lg">
      <div className="font-semibold">{payload[0].payload.label}</div>
      <div className="text-[var(--muted-foreground)]">{payload[0].value} application{payload[0].value === 1 ? '' : 's'}</div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, accent = 'primary' }) {
  const tone = {
    primary: 'text-[var(--primary)] bg-[color-mix(in_oklab,var(--primary)_15%,transparent)]',
    info:    'text-[var(--info)] bg-[color-mix(in_oklab,var(--info)_15%,transparent)]',
    success: 'text-[var(--success)] bg-[color-mix(in_oklab,var(--success)_15%,transparent)]',
    warning: 'text-[var(--warning)] bg-[color-mix(in_oklab,var(--warning)_15%,transparent)]',
  }[accent];

  return (
    <Card hover className="overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">{label}</span>
          <span className={`flex h-7 w-7 items-center justify-center rounded-md ${tone}`}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-semibold tracking-tight">{value}</span>
          {hint && <span className="text-xs text-[var(--muted-foreground)]">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function SetupPrompt({ onNavigate }) {
  return (
    <div className="flex h-full items-center justify-center px-4 py-10">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary)]/15 text-[var(--primary)] mb-2">
            <Sparkles className="h-5 w-5" />
          </div>
          <CardTitle>Welcome to JobTracker</CardTitle>
          <CardDescription>Connect your free Supabase workspace to start tracking applications, contacts, interviews, and resumes.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={() => onNavigate('settings')}>Open Settings <ArrowUpRight className="h-3.5 w-3.5" /></Button>
          <Button variant="outline" asChild>
            <a href="https://supabase.com" target="_blank" rel="noreferrer">Get Supabase <ExternalLink className="h-3.5 w-3.5" /></a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="px-4 sm:px-8 py-8 max-w-7xl mx-auto w-full space-y-6">
      <Skeleton className="h-10 w-60" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}

function computeStats(apps) {
  const total = apps.length;
  const active = apps.filter((a) => !['closed', 'saved'].includes(a.status)).length;
  const byStatus = {};
  APP_STATUSES.forEach((s) => { byStatus[s.key] = 0; });
  apps.forEach((a) => { if (byStatus[a.status] !== undefined) byStatus[a.status]++; });
  const interviews = (byStatus.interview || 0) + (byStatus.phone_screen || 0);
  const offers = byStatus.offer || 0;
  const interviewRate = total ? Math.round(((interviews + offers) / total) * 100) : 0;
  const offerRate = interviews + offers ? Math.round((offers / (interviews + offers)) * 100) : 0;
  return { total, active, byStatus, interviews, offers, interviewRate, offerRate };
}

function buildWeeklyTrend(apps) {
  const days = 14;
  const out = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const count = apps.filter((a) => {
      const t = new Date(a.created_at).getTime();
      return t >= d.getTime() && t < next.getTime();
    }).length;
    out.push({ date: d, label: format(d, 'MMM d'), count });
  }
  return out;
}

function buildUpcoming(apps, events) {
  const now = new Date();
  const horizon = addDays(now, 7);
  const fromEvents = (events || [])
    .filter((e) => e.starts_at && (isToday(new Date(e.starts_at)) || isAfter(new Date(e.starts_at), now)))
    .filter((e) => isWithinInterval(new Date(e.starts_at), { start: now, end: addDays(now, 30) }))
    .map((e) => ({ id: `e-${e.id}`, title: e.title, date: new Date(e.starts_at), subtitle: e.location || e.meeting_link, kind: e.kind?.replace('_', ' ') }));

  // also synthesize entries from interview-status apps that have follow_up_date
  const fromApps = (apps || [])
    .filter((a) => a.follow_up_date && isAfter(new Date(a.follow_up_date), now))
    .filter((a) => isWithinInterval(new Date(a.follow_up_date), { start: now, end: horizon }))
    .map((a) => ({ id: `a-${a.id}`, title: `Follow up: ${a.job_title}`, date: new Date(a.follow_up_date), subtitle: a.company, kind: 'follow up' }));

  return [...fromEvents, ...fromApps].sort((a, b) => a.date - b.date).slice(0, 6);
}
