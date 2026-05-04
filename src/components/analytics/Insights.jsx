import { useMemo } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer,
  Tooltip as ChartTooltip, XAxis, YAxis, RadialBar, RadialBarChart, Area, AreaChart
} from 'recharts';
import { format, eachDayOfInterval, subDays, parseISO, getDay, eachWeekOfInterval, subWeeks, startOfWeek } from 'date-fns';
import { TrendingUp, BarChart3, PieChart as PieIcon, Activity } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useApp } from '../../lib/app-context';
import { APP_STATUSES, STATUS_MAP } from '../../utils/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { EmptyState, PageLoader } from '../ui/feedback';

export default function Analytics() {
  const configured = isSupabaseConfigured();
  const { navigate } = useApp();
  const { data: apps, loading } = useSupabaseQuery('applications');
  const { data: events } = useSupabaseQuery('events');

  const trend30 = useMemo(() => buildDaily(apps || [], 30), [apps]);
  const weekly12 = useMemo(() => buildWeekly(apps || [], 12), [apps]);
  const byStatus = useMemo(() => APP_STATUSES.map(s => ({ name: s.label, key: s.key, value: (apps || []).filter(a => a.status === s.key).length, fill: s.color })), [apps]);
  const byMode = useMemo(() => {
    const counts = { remote: 0, hybrid: 0, 'on-site': 0, other: 0 };
    for (const a of (apps || [])) counts[a.work_mode || 'other'] = (counts[a.work_mode || 'other'] || 0) + 1;
    return Object.entries(counts).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [apps]);
  const bySource = useMemo(() => {
    const map = new Map();
    for (const a of (apps || [])) { const k = a.source_site || 'Direct'; map.set(k, (map.get(k) || 0) + 1); }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [apps]);
  const heatmap = useMemo(() => buildHeatmap(apps || []), [apps]);

  if (!configured) return (
    <div className="px-4 sm:px-8 py-10 max-w-3xl mx-auto"><EmptyState icon={BarChart3} title="Connect Supabase first"
      description="Visualize your job hunt — application velocity, conversion rates, source breakdown, and more."
      action={<Button onClick={() => navigate('settings')}>Open Settings</Button>}
    /></div>
  );
  if (loading && (!apps || apps.length === 0)) return <PageLoader />;

  const total = (apps || []).length;
  const interviews = (apps || []).filter(a => ['interview', 'phone_screen', 'offer'].includes(a.status)).length;
  const offers = (apps || []).filter(a => a.status === 'offer').length;
  const closed = (apps || []).filter(a => a.status === 'closed').length;
  const interviewRate = total ? Math.round((interviews / total) * 100) : 0;
  const offerRate = interviews ? Math.round((offers / interviews) * 100) : 0;

  const PIE_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)'];

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto w-full">
      <div className="mb-5 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Patterns, conversion rates, and where your time goes</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <KPI label="Total applications" value={total} sub={`${apps.filter(a => !['closed', 'saved'].includes(a.status)).length} active`} />
        <KPI label="Interviews" value={interviews} sub={`${interviewRate}% from apps`} />
        <KPI label="Offers" value={offers} sub={`${offerRate}% from interviews`} />
        <KPI label="Closed" value={closed} sub={total ? `${Math.round((closed / total) * 100)}% of total` : ''} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-[var(--primary)]" />Application velocity</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend30}>
                <defs>
                  <linearGradient id="g-velocity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} allowDecimals={false} />
                <ChartTooltip cursor={{ stroke: 'var(--border)' }} content={<TT />} />
                <Area type="monotone" dataKey="count" stroke="var(--chart-1)" strokeWidth={2} fill="url(#g-velocity)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PieIcon className="h-4 w-4 text-[var(--primary)]" />By status</CardTitle>
            <CardDescription>Pipeline distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatus.filter(d => d.value > 0)} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="var(--card)">
                  {byStatus.filter(d => d.value > 0).map((entry) => <Cell key={entry.key} fill={entry.fill} />)}
                </Pie>
                <ChartTooltip content={<TT />} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-[var(--primary)]" />Weekly trend</CardTitle>
            <CardDescription>Apps submitted, last 12 weeks</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly12}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} allowDecimals={false} />
                <ChartTooltip cursor={{ fill: 'var(--accent)', opacity: 0.5 }} content={<TT />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {weekly12.map((_, i) => <Cell key={i} fill="var(--chart-1)" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Work mode</CardTitle>
            <CardDescription>Remote vs on-site breakdown</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byMode} dataKey="value" nameKey="name" innerRadius={42} outerRadius={70} paddingAngle={2} stroke="var(--card)">
                  {byMode.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <ChartTooltip content={<TT />} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top sources</CardTitle>
            <CardDescription>Where your applications come from</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySource} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} width={90} />
                <ChartTooltip cursor={{ fill: 'var(--accent)', opacity: 0.5 }} content={<TT />} />
                <Bar dataKey="value" fill="var(--chart-2)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Heatmap */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-[var(--primary)]" />Activity heatmap</CardTitle>
            <CardDescription>Application activity over the last 12 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <Heatmap data={heatmap} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPI({ label, value, sub }) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">{label}</div>
        <div className="text-3xl font-semibold mt-1 tracking-tight">{value}</div>
        {sub && <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function TT({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--popover)] px-3 py-2 text-xs shadow-lg">
      <div className="font-semibold">{p.payload.label || p.payload.name || label}</div>
      <div className="text-[var(--muted-foreground)]">{p.value} {p.value === 1 ? 'application' : 'applications'}</div>
    </div>
  );
}

function buildDaily(apps, days) {
  const out = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(today, i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const count = apps.filter(a => {
      const t = new Date(a.created_at).getTime();
      return t >= d.getTime() && t < next.getTime();
    }).length;
    out.push({ date: d, label: format(d, 'MMM d'), count });
  }
  return out;
}

function buildWeekly(apps, weeks) {
  const out = [];
  const today = new Date();
  for (let i = weeks - 1; i >= 0; i--) {
    const ws = startOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
    const we = new Date(ws); we.setDate(we.getDate() + 7);
    const count = apps.filter(a => {
      const t = new Date(a.created_at).getTime();
      return t >= ws.getTime() && t < we.getTime();
    }).length;
    out.push({ label: format(ws, "MMM d"), count });
  }
  return out;
}

function buildHeatmap(apps) {
  // 12 weeks x 7 days grid
  const today = new Date();
  const start = startOfWeek(subWeeks(today, 11), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start, end: today });
  const counts = new Map();
  for (const a of apps) {
    const k = format(new Date(a.created_at), 'yyyy-MM-dd');
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  return days.map(d => ({ date: d, count: counts.get(format(d, 'yyyy-MM-dd')) || 0 }));
}

function Heatmap({ data }) {
  // arrange into 7-day rows
  const rows = [[], [], [], [], [], [], []]; // sun..sat
  for (const cell of data) {
    rows[getDay(cell.date)].push(cell);
  }
  const max = Math.max(1, ...data.map(d => d.count));
  const levels = [
    'color-mix(in oklab, var(--muted) 100%, transparent)',
    'color-mix(in oklab, var(--primary) 18%, var(--card))',
    'color-mix(in oklab, var(--primary) 38%, var(--card))',
    'color-mix(in oklab, var(--primary) 65%, var(--card))',
    'var(--primary)',
  ];
  const level = (n) => {
    if (n === 0) return levels[0];
    const ratio = n / max;
    if (ratio < 0.25) return levels[1];
    if (ratio < 0.5) return levels[2];
    if (ratio < 0.75) return levels[3];
    return levels[4];
  };

  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1.5 min-w-[600px]">
        <div className="flex flex-col gap-1.5 pr-1.5 text-[10px] text-[var(--muted-foreground)]">
          {labels.map((l, i) => <div key={l} className="h-3.5 leading-none">{i % 2 === 1 ? l : ''}</div>)}
        </div>
        <div className="flex flex-col gap-1.5">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-1.5">
              {row.map((cell) => (
                <div
                  key={cell.date.toISOString()}
                  className="h-3.5 w-3.5 rounded-[3px] cursor-pointer transition-transform hover:scale-125"
                  style={{ background: level(cell.count) }}
                  title={`${format(cell.date, 'MMM d')} — ${cell.count} apps`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-3 text-[10px] text-[var(--muted-foreground)]">
        <span>Less</span>
        {levels.map((c, i) => <div key={i} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: c }} />)}
        <span>More</span>
      </div>
    </div>
  );
}
