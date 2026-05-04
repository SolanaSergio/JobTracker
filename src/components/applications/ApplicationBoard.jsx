import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext, DragOverlay, useSensor, useSensors, PointerSensor, KeyboardSensor, closestCorners,
  useDroppable as useDndDroppable,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, Search as SearchIcon, MapPin, ExternalLink, Trash2, Building2, LayoutGrid, Rows3, X
} from 'lucide-react';
import { useSupabaseQuery, useSupabaseCrud, useActivityLog } from '../../hooks/useSupabase';
import { usePersistedState } from '../../hooks/usePersistedState';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useApp } from '../../lib/app-context';
import { APP_STATUSES, STATUS_MAP } from '../../utils/constants';
import { formatSalary, formatDate, timeAgo, truncate } from '../../utils/helpers';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { EmptyState, PageLoader, toast } from '../ui/feedback';
import { cn } from '../../lib/cn';

export default function ApplicationBoard() {
  const configured = isSupabaseConfigured();
  const { navigate, setQuickAddOpen } = useApp();
  const { data: apps, loading, refetch } = useSupabaseQuery('applications');
  const { update, remove } = useSupabaseCrud('applications');
  const log = useActivityLog();

  const [view, setView] = usePersistedState('apps:view', 'board');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = usePersistedState('apps:filterStatus', 'all');
  const [filterMode, setFilterMode] = usePersistedState('apps:filterMode', 'all');
  const [activeId, setActiveId] = useState(null);
  const [selected, setSelected] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  if (!configured) return (
    <div className="px-4 sm:px-8 py-10 max-w-3xl mx-auto"><EmptyState
      icon={Building2} title="Connect Supabase first"
      description="Configure Supabase in Settings to start tracking your application pipeline."
      action={<Button onClick={() => navigate('settings')}>Open Settings</Button>}
    /></div>
  );
  if (loading && apps.length === 0) return <PageLoader />;

  const filtered = apps.filter((a) => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (filterMode !== 'all' && a.work_mode !== filterMode) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.job_title?.toLowerCase().includes(q) ||
        a.company?.toLowerCase().includes(q) ||
        a.location?.toLowerCase().includes(q) ||
        a.notes?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const grouped = APP_STATUSES.map((s) => ({
    status: s,
    items: filtered.filter((a) => a.status === s.key),
  }));

  const handleDragStart = (e) => setActiveId(e.active.id);
  const handleDragEnd = async (e) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const app = apps.find((a) => a.id === active.id);
    const overStatus = over.data.current?.status || over.id;
    const targetStatus = APP_STATUSES.find((s) => s.key === overStatus)?.key;
    if (!app || !targetStatus || app.status === targetStatus) return;
    try {
      const updates = { status: targetStatus };
      if (targetStatus === 'applied' && !app.applied_date) updates.applied_date = new Date().toISOString();
      await update(app.id, updates);
      await log('status_change', 'application', app.id, `Moved "${app.job_title}" to ${STATUS_MAP[targetStatus].label}`);
      toast.success(`Moved to ${STATUS_MAP[targetStatus].label}`);
      refetch();
    } catch (err) { toast.error(err.message); }
  };

  const activeApp = activeId ? apps.find((a) => a.id === activeId) : null;

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[1500px] mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Applications</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{apps.length} tracked · {filtered.length} matching</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Tabs value={view} onValueChange={setView}>
            <TabsList className="h-9">
              <TabsTrigger value="board" className="h-7 text-xs"><LayoutGrid className="h-3.5 w-3.5 mr-1" />Board</TabsTrigger>
              <TabsTrigger value="list" className="h-7 text-xs"><Rows3 className="h-3.5 w-3.5 mr-1" />List</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => setQuickAddOpen(true)} className="ml-auto sm:ml-0"><Plus className="h-4 w-4" />Add</Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-3 sm:p-4 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, company, notes…" className="pl-9 h-9" />
            {search && (
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" onClick={() => setSearch('')} aria-label="Clear">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 w-auto min-w-[140px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {APP_STATUSES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterMode} onValueChange={setFilterMode}>
            <SelectTrigger className="h-9 w-auto min-w-[120px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any mode</SelectItem>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="on-site">On-site</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {filtered.length === 0 && (
        <EmptyState icon={Building2} title="No applications yet"
          description="Track your first opportunity, or save jobs from Search."
          action={<Button onClick={() => setQuickAddOpen(true)}><Plus className="h-4 w-4" />Add manually</Button>}
        />
      )}

      {filtered.length > 0 && view === 'board' && (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 -mx-4 sm:mx-0 px-4 sm:px-0 snap-x snap-mandatory no-scrollbar">
            {grouped.map(({ status, items }) => (
              <Column key={status.key} status={status} items={items} onCardClick={setSelected} />
            ))}
          </div>
          <DragOverlay>
            {activeApp && <CardItem app={activeApp} dragging />}
          </DragOverlay>
        </DndContext>
      )}

      {filtered.length > 0 && view === 'list' && (
        <ListView apps={filtered} onSelect={setSelected} onUpdate={async (id, patch) => { await update(id, patch); refetch(); }} />
      )}

      <ApplicationDetail
        app={selected}
        onClose={() => setSelected(null)}
        onUpdate={async (patch) => { await update(selected.id, patch); refetch(); setSelected({ ...selected, ...patch }); toast.success('Updated'); }}
        onDelete={async () => { await remove(selected.id); refetch(); setSelected(null); toast.success('Deleted'); }}
      />
    </div>
  );
}

function Column({ status, items, onCardClick }) {
  const { setNodeRef, isOver } = useDroppable(status.key);
  return (
    <div ref={setNodeRef} className={cn(
      'w-[88vw] sm:w-80 shrink-0 snap-start rounded-xl border border-[var(--border)] bg-[var(--card)]/40 transition-colors',
      isOver && 'border-[var(--primary)]/60 bg-[var(--primary)]/5'
    )}>
      <div className="px-3 py-2.5 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--card)] rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full status-${status.key} status-bar`} />
          <span className="text-xs font-semibold uppercase tracking-wider">{status.label}</span>
        </div>
        <Badge variant="outline" className="h-5 min-w-5 justify-center px-1.5">{items.length}</Badge>
      </div>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="p-2 sm:p-2.5 flex flex-col gap-2 min-h-[120px]">
          <AnimatePresence>
            {items.map((app) => (
              <SortableCard key={app.id} app={app} onClick={() => onCardClick(app)} />
            ))}
          </AnimatePresence>
          {items.length === 0 && (
            <div className="text-[11px] text-[var(--muted-foreground)] text-center py-4 border border-dashed border-[var(--border)] rounded-lg">Drop here</div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function useDroppable(statusKey) {
  return useDndDroppable({ id: statusKey, data: { status: statusKey } });
}

function SortableCard({ app, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: app.id, data: { status: app.status } });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (isDragging) return;
        e.stopPropagation();
        onClick();
      }}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: isDragging ? 0.4 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
    >
      <CardItem app={app} />
    </motion.div>
  );
}

function CardItem({ app, dragging }) {
  return (
    <div className={cn(
      'group rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 cursor-grab active:cursor-grabbing transition-all',
      'hover:border-[color-mix(in_oklab,var(--border)_50%,var(--foreground))]',
      dragging && 'rotate-2 shadow-elev-3 ring-1 ring-[var(--primary)]/50'
    )}>
      <div className="text-[13px] font-semibold leading-tight line-clamp-2">{app.job_title}</div>
      <div className="text-xs text-[var(--primary)] truncate mt-0.5 font-medium">{app.company}</div>
      <div className="flex flex-wrap gap-1 mt-2">
        {app.city && <Badge variant="outline" className="text-[10px] py-0"><MapPin className="h-2.5 w-2.5" />{app.city}</Badge>}
        {formatSalary(app.salary_min, app.salary_max) && <Badge variant="outline" className="text-[10px] py-0">{formatSalary(app.salary_min, app.salary_max)}</Badge>}
        {app.work_mode === 'remote' && <Badge variant="success" className="text-[10px] py-0">Remote</Badge>}
      </div>
      <div className="flex items-center justify-between mt-2 text-[10px] text-[var(--muted-foreground)]">
        <span>{timeAgo(app.created_at)}</span>
        {app.applied_date && <span>Applied {formatDate(app.applied_date, 'MMM d')}</span>}
      </div>
    </div>
  );
}

function ListView({ apps, onSelect, onUpdate }) {
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[var(--muted-foreground)] text-xs uppercase tracking-wider border-b border-[var(--border)]">
            <tr>
              <th className="text-left p-3 font-medium">Position</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Location</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">Salary</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Updated</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => (
              <tr key={app.id} onClick={() => onSelect(app)} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--accent)] cursor-pointer transition-colors">
                <td className="p-3">
                  <div className="font-semibold">{app.job_title}</div>
                  <div className="text-xs text-[var(--primary)]">{app.company}</div>
                </td>
                <td className="p-3 hidden md:table-cell text-[var(--muted-foreground)]">{app.location || '—'}</td>
                <td className="p-3 hidden lg:table-cell text-[var(--muted-foreground)]">{formatSalary(app.salary_min, app.salary_max) || '—'}</td>
                <td className="p-3">
                  <Select value={app.status} onValueChange={(v) => onUpdate(app.id, { status: v })}>
                    <SelectTrigger className="h-8 text-xs w-auto" onClick={(e) => e.stopPropagation()}>
                      <span className={`h-2 w-2 rounded-full mr-1.5 status-${app.status} status-bar`} />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent onClick={(e) => e.stopPropagation()}>
                      {APP_STATUSES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-3 hidden md:table-cell text-xs text-[var(--muted-foreground)]">{timeAgo(app.updated_at || app.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ApplicationDetail({ app, onClose, onUpdate, onDelete }) {
  const [notes, setNotes] = useState('');
  const [editing, setEditing] = useState(false);
  if (!app) return null;
  return (
    <Dialog open={!!app} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="leading-snug">{app.job_title}</DialogTitle>
          <p className="text-sm text-[var(--primary)] font-medium">{app.company}</p>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Badge status={app.status}>{STATUS_MAP[app.status]?.label}</Badge>
          {app.location && <Badge variant="outline"><MapPin className="h-3 w-3" />{app.location}</Badge>}
          {formatSalary(app.salary_min, app.salary_max) && <Badge variant="warning">{formatSalary(app.salary_min, app.salary_max)}</Badge>}
          {app.work_mode && <Badge variant="info">{app.work_mode}</Badge>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Created" value={formatDate(app.created_at)} />
          <Stat label="Applied" value={app.applied_date ? formatDate(app.applied_date) : '—'} />
        </div>

        {app.source_url && (
          <Button variant="outline" asChild className="w-full">
            <a href={app.source_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" />View original posting</a>
          </Button>
        )}

        <div>
          <Label>Status</Label>
          <Select value={app.status} onValueChange={(v) => onUpdate({ status: v, ...(v === 'applied' && !app.applied_date ? { applied_date: new Date().toISOString() } : {}) })}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>{APP_STATUSES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label>Notes</Label>
            {!editing && <Button size="sm" variant="ghost" onClick={() => { setNotes(app.notes || ''); setEditing(true); }}>Edit</Button>}
          </div>
          {editing ? (
            <div className="space-y-2">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} placeholder="Interview prep, contacts, questions to ask…" />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                <Button size="sm" onClick={() => { onUpdate({ notes }); setEditing(false); }}>Save notes</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)] whitespace-pre-wrap">{app.notes || <span className="italic">No notes yet.</span>}</p>
          )}
        </div>

        {app.description && (
          <div>
            <Label>Job description</Label>
            <p className="text-xs text-[var(--muted-foreground)] mt-1.5 whitespace-pre-wrap leading-relaxed max-h-40 overflow-auto">{truncate(app.description, 1500)}</p>
          </div>
        )}

        <DialogFooter className="border-t border-[var(--border)] pt-4">
          <Button variant="destructive" size="sm" onClick={onDelete}><Trash2 className="h-4 w-4" />Delete</Button>
          <div className="flex-1" />
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">{label}</div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}
