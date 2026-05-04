import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ListChecks, Trash2, Calendar, MoreHorizontal, Pencil } from 'lucide-react';
import { isPast, parseISO, format, isToday } from 'date-fns';
import { useSupabaseQuery, useSupabaseCrud } from '../../hooks/useSupabase';
import { usePersistedState } from '../../hooks/usePersistedState';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useApp } from '../../lib/app-context';
import { TASK_PRIORITIES } from '../../utils/constants';
import { formatRelative } from '../../utils/helpers';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { EmptyState, PageLoader, toast } from '../ui/feedback';
import { cn } from '../../lib/cn';

export default function TasksView() {
  const configured = isSupabaseConfigured();
  const { navigate } = useApp();
  const { data: tasks, loading, refetch } = useSupabaseQuery('tasks');
  const { insert, update, remove } = useSupabaseCrud('tasks');

  const [filter, setFilter] = usePersistedState('tasks:filter', 'open');
  const [newTitle, setNewTitle] = useState('');
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => {
    let list = tasks || [];
    if (filter === 'open') list = list.filter(t => !t.completed_at);
    if (filter === 'done') list = list.filter(t => !!t.completed_at);
    if (filter === 'overdue') list = list.filter(t => !t.completed_at && t.due_date && isPast(parseISO(t.due_date)));
    return list.sort((a, b) => {
      if (a.completed_at && !b.completed_at) return 1;
      if (!a.completed_at && b.completed_at) return -1;
      const ad = a.due_date ? parseISO(a.due_date).getTime() : Infinity;
      const bd = b.due_date ? parseISO(b.due_date).getTime() : Infinity;
      return ad - bd;
    });
  }, [tasks, filter]);

  const counts = useMemo(() => ({
    open: (tasks || []).filter(t => !t.completed_at).length,
    done: (tasks || []).filter(t => t.completed_at).length,
    overdue: (tasks || []).filter(t => !t.completed_at && t.due_date && isPast(parseISO(t.due_date))).length,
  }), [tasks]);

  if (!configured) return (
    <div className="px-4 sm:px-8 py-10 max-w-3xl mx-auto"><EmptyState icon={ListChecks} title="Connect Supabase first"
      description="Track action items, reminders, and follow-ups."
      action={<Button onClick={() => navigate('settings')}>Open Settings</Button>}
    /></div>
  );
  if (loading && tasks.length === 0) return <PageLoader />;

  const quickAdd = async () => {
    if (!newTitle.trim()) return;
    try { await insert({ title: newTitle.trim(), priority: 'normal' }); setNewTitle(''); refetch(); }
    catch (e) { toast.error(e.message); }
  };

  const toggle = async (task) => {
    try {
      await update(task.id, { completed_at: task.completed_at ? null : new Date().toISOString() });
      refetch();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-3xl mx-auto w-full">
      <div className="mb-5 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Tasks</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Reminders, follow-ups, and to-dos for your job hunt</p>
      </div>

      <Card className="mb-4">
        <CardContent className="p-3 sm:p-4 flex gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && quickAdd()}
            placeholder="Add a task… (press Enter)"
          />
          <Button onClick={quickAdd}><Plus className="h-4 w-4" />Add</Button>
        </CardContent>
      </Card>

      <Tabs value={filter} onValueChange={setFilter} className="mb-4">
        <TabsList>
          <TabsTrigger value="open">Open <Badge variant="outline" className="ml-1.5">{counts.open}</Badge></TabsTrigger>
          <TabsTrigger value="overdue">Overdue <Badge variant="destructive" className="ml-1.5">{counts.overdue}</Badge></TabsTrigger>
          <TabsTrigger value="done">Done <Badge variant="outline" className="ml-1.5">{counts.done}</Badge></TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState icon={ListChecks} title="Nothing here" description="Add a task to keep your hunt on track." />
      ) : (
        <Card>
          <ul className="divide-y divide-[var(--border)]">
            <AnimatePresence>
              {filtered.map(task => (
                <TaskRow key={task.id} task={task} onToggle={() => toggle(task)} onEdit={() => setEditing(task)} onDelete={async () => { await remove(task.id); refetch(); toast.success('Deleted'); }} />
              ))}
            </AnimatePresence>
          </ul>
        </Card>
      )}

      <EditTaskDialog
        task={editing}
        onClose={() => setEditing(null)}
        onSave={async (patch) => { await update(editing.id, patch); refetch(); setEditing(null); toast.success('Saved'); }}
      />
    </div>
  );
}

function TaskRow({ task, onToggle, onEdit, onDelete }) {
  const overdue = task.due_date && !task.completed_at && isPast(parseISO(task.due_date));
  const priority = TASK_PRIORITIES.find(p => p.key === task.priority);
  return (
    <motion.li
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="group p-3 sm:p-4 flex items-start gap-3"
    >
      <Checkbox checked={!!task.completed_at} onCheckedChange={onToggle} className="mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className={cn('text-sm font-medium leading-tight', task.completed_at && 'line-through text-[var(--muted-foreground)]')}>{task.title}</div>
        {task.notes && <div className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2">{task.notes}</div>}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {priority && priority.key !== 'normal' && (
            <Badge variant="outline" style={{ color: priority.color, borderColor: priority.color + '50' }}>{priority.label}</Badge>
          )}
          {task.due_date && (
            <Badge variant={overdue ? 'destructive' : 'outline'}>
              <Calendar className="h-3 w-3" />{formatRelative(task.due_date)}
            </Badge>
          )}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onEdit}><Pencil />Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-[var(--destructive)] focus:text-[var(--destructive)]"><Trash2 />Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.li>
  );
}

function EditTaskDialog({ task, onClose, onSave }) {
  const [form, setForm] = useState({ title: '', notes: '', priority: 'normal', due_date: '' });

  useEffect(() => {
    if (task) setForm({
      title: task.title || '',
      notes: task.notes || '',
      priority: task.priority || 'normal',
      due_date: task.due_date ? task.due_date.slice(0, 16) : '',
    });
  }, [task]);

  if (!task) return null;
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={!!task} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit task</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Title</Label><Input className="mt-1.5" value={form.title} onChange={(e) => set('title', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Priority</Label>
              <Select value={form.priority || 'normal'} onValueChange={(v) => set('priority', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{TASK_PRIORITIES.map(p => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Due date</Label>
              <Input className="mt-1.5" type="datetime-local" value={form.due_date || ''} onChange={(e) => set('due_date', e.target.value)} />
            </div>
          </div>
          <div><Label>Notes</Label><Textarea className="mt-1.5" value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({ ...form, due_date: form.due_date ? new Date(form.due_date).toISOString() : null })}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
