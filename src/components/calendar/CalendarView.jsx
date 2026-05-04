import { useMemo, useState } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths,
  format, isSameMonth, isSameDay, isToday, parseISO, isAfter, addWeeks
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, MapPin, Link as LinkIcon, Clock, ExternalLink } from 'lucide-react';
import { useSupabaseQuery, useSupabaseCrud } from '../../hooks/useSupabase';
import { usePersistedState } from '../../hooks/usePersistedState';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useApp } from '../../lib/app-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { EmptyState, PageLoader, toast } from '../ui/feedback';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { cn } from '../../lib/cn';

const KIND_COLORS = {
  interview: 'hsl(38 92% 60%)',
  phone_screen: 'hsl(263 75% 65%)',
  follow_up: 'hsl(217 92% 65%)',
  networking: 'hsl(142 70% 50%)',
  other: 'hsl(240 5% 60%)',
};

export default function CalendarView() {
  const configured = isSupabaseConfigured();
  const { setQuickAddOpen, navigate } = useApp();
  const { data: events, loading, refetch } = useSupabaseQuery('events', { orderBy: 'starts_at', ascending: true });
  const { remove } = useSupabaseCrud('events');

  const [cursor, setCursor] = useState(new Date());
  const [view, setView] = usePersistedState('calendar:view', 'month');
  const [selectedEvent, setSelectedEvent] = useState(null);

  if (!configured) return (
    <div className="px-4 sm:px-8 py-10 max-w-3xl mx-auto"><EmptyState
      icon={CalendarIcon} title="Connect Supabase first"
      description="Track interviews, phone screens, follow-ups, and networking events in one calendar."
      action={<Button onClick={() => navigate('settings')}>Open Settings</Button>}
    /></div>
  );
  if (loading && (!events || events.length === 0)) return <PageLoader />;

  const handleDelete = async () => {
    try { await remove(selectedEvent.id); toast.success('Event removed'); setSelectedEvent(null); refetch(); }
    catch (e) { toast.error(e.message); }
  };

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto w-full">
      <div className="flex items-end justify-between mb-5 sm:mb-6 flex-col sm:flex-row gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Interviews, follow-ups, and networking events</p>
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <Tabs value={view} onValueChange={setView}>
            <TabsList className="h-9">
              <TabsTrigger value="month" className="h-7 text-xs">Month</TabsTrigger>
              <TabsTrigger value="agenda" className="h-7 text-xs">Agenda</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => setQuickAddOpen(true)} className="ml-auto"><Plus className="h-4 w-4" />Event</Button>
        </div>
      </div>

      {view === 'month' ? (
        <MonthView cursor={cursor} setCursor={setCursor} events={events || []} onSelect={setSelectedEvent} />
      ) : (
        <AgendaView events={events || []} onSelect={setSelectedEvent} />
      )}

      <Dialog open={!!selectedEvent} onOpenChange={(o) => !o && setSelectedEvent(null)}>
        <DialogContent>
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEvent.title}</DialogTitle>
                <p className="text-sm text-[var(--muted-foreground)] flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{format(parseISO(selectedEvent.starts_at), 'EEEE, MMM d · h:mm a')}</p>
              </DialogHeader>
              <div className="flex flex-wrap gap-1.5">
                <Badge style={{ background: `${KIND_COLORS[selectedEvent.kind] || KIND_COLORS.other}25`, color: KIND_COLORS[selectedEvent.kind] || KIND_COLORS.other, borderColor: 'transparent' }}>{(selectedEvent.kind || 'event').replace('_', ' ')}</Badge>
                {selectedEvent.location && <Badge variant="outline"><MapPin className="h-3 w-3" />{selectedEvent.location}</Badge>}
              </div>
              {selectedEvent.meeting_link && (
                <Button asChild variant="outline" className="w-full"><a href={selectedEvent.meeting_link} target="_blank" rel="noreferrer"><LinkIcon className="h-4 w-4" />Join meeting</a></Button>
              )}
              {selectedEvent.notes && (
                <p className="text-sm text-[var(--muted-foreground)] whitespace-pre-wrap">{selectedEvent.notes}</p>
              )}
              <DialogFooter>
                <Button variant="destructive" size="sm" onClick={handleDelete}>Delete</Button>
                <div className="flex-1" />
                <Button variant="ghost" onClick={() => setSelectedEvent(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MonthView({ cursor, setCursor, events, onSelect }) {
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = useMemo(() => {
    const out = [];
    let d = gridStart;
    while (d <= gridEnd) { out.push(d); d = addDays(d, 1); }
    return out;
  }, [gridStart, gridEnd]);

  const dayEvents = useMemo(() => {
    const map = new Map();
    for (const e of events) {
      if (!e.starts_at) continue;
      const k = format(parseISO(e.starts_at), 'yyyy-MM-dd');
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(e);
    }
    return map;
  }, [events]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="text-lg">{format(cursor, 'MMMM yyyy')}</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => setCursor(subMonths(cursor, 1))}><ChevronLeft /></Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>Today</Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight /></Button>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 pb-4">
        <div className="grid grid-cols-7 gap-px text-center text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-px bg-[var(--border)] rounded-lg overflow-hidden">
          {days.map((d) => {
            const k = format(d, 'yyyy-MM-dd');
            const items = dayEvents.get(k) || [];
            const isCurMonth = isSameMonth(d, monthStart);
            return (
              <div key={k} className={cn(
                'min-h-[80px] sm:min-h-[100px] bg-[var(--card)] p-1.5 flex flex-col gap-1',
                !isCurMonth && 'opacity-40',
              )}>
                <div className="flex items-center justify-between">
                  <span className={cn(
                    'text-[11px] font-semibold inline-flex h-5 w-5 items-center justify-center rounded',
                    isToday(d) && 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  )}>{format(d, 'd')}</span>
                </div>
                <div className="flex flex-col gap-1 overflow-hidden">
                  {items.slice(0, 3).map(e => (
                    <button
                      key={e.id}
                      onClick={() => onSelect(e)}
                      className="text-left text-[10px] sm:text-[11px] truncate px-1.5 py-0.5 rounded font-medium hover:opacity-80"
                      style={{ background: `${KIND_COLORS[e.kind] || KIND_COLORS.other}25`, color: KIND_COLORS[e.kind] || KIND_COLORS.other }}
                    >
                      <span className="hidden sm:inline">{format(parseISO(e.starts_at), 'h:mma')} </span>{e.title}
                    </button>
                  ))}
                  {items.length > 3 && <div className="text-[10px] text-[var(--muted-foreground)]">+{items.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function AgendaView({ events, onSelect }) {
  const upcoming = events
    .filter(e => e.starts_at && (isToday(parseISO(e.starts_at)) || isAfter(parseISO(e.starts_at), new Date())))
    .sort((a, b) => parseISO(a.starts_at) - parseISO(b.starts_at));
  if (!upcoming.length) return <EmptyState icon={CalendarIcon} title="No upcoming events" description="Add an interview or follow-up to see it here." />;

  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y divide-[var(--border)]">
          {upcoming.map(e => {
            const d = parseISO(e.starts_at);
            return (
              <li key={e.id} onClick={() => onSelect(e)} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-[var(--accent)] cursor-pointer transition-colors">
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-[var(--secondary)]">
                  <span className="text-[9px] uppercase tracking-wider text-[var(--muted-foreground)]">{format(d, 'MMM')}</span>
                  <span className="text-base font-bold leading-none">{format(d, 'd')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{e.title}</div>
                  <div className="text-xs text-[var(--muted-foreground)] flex items-center gap-2"><Clock className="h-3 w-3" />{format(d, 'EEE, h:mm a')}{e.location && <> · {e.location}</>}</div>
                </div>
                <Badge style={{ background: `${KIND_COLORS[e.kind] || KIND_COLORS.other}25`, color: KIND_COLORS[e.kind] || KIND_COLORS.other, borderColor: 'transparent' }} className="hidden sm:inline-flex">{(e.kind || 'event').replace('_', ' ')}</Badge>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
