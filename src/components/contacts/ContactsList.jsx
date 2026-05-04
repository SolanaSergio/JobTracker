import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search as SearchIcon, Plus, Mail, Phone, Link2 as LinkedinIcon, Building2, Users, Trash2, MessageSquare, Pencil, MoreHorizontal, ExternalLink
} from 'lucide-react';
import { useSupabaseQuery, useSupabaseCrud, useActivityLog } from '../../hooks/useSupabase';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useApp } from '../../lib/app-context';
import { CALL_OUTCOMES } from '../../utils/constants';
import { formatDateTime, timeAgo, getInitials } from '../../utils/helpers';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { EmptyState, PageLoader, toast } from '../ui/feedback';
import { cn } from '../../lib/cn';

export default function ContactsList() {
  const configured = isSupabaseConfigured();
  const { navigate, setQuickAddOpen } = useApp();
  const { data: contacts, loading, refetch } = useSupabaseQuery('contacts');
  const { data: callLogs, refetch: refetchLogs } = useSupabaseQuery('call_logs', { orderBy: 'call_date', ascending: false });
  const { update, remove } = useSupabaseCrud('contacts');
  const { insert: insertCall } = useSupabaseCrud('call_logs');
  const log = useActivityLog();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [logCallFor, setLogCallFor] = useState(null);

  if (!configured) return (
    <div className="px-4 sm:px-8 py-10 max-w-3xl mx-auto"><EmptyState icon={Users} title="Connect Supabase first"
      description="Manage recruiters, hiring managers, and your professional network."
      action={<Button onClick={() => navigate('settings')}>Open Settings</Button>}
    /></div>
  );
  if (loading && contacts.length === 0) return <PageLoader />;

  const filtered = contacts.filter(c =>
    !search || [c.name, c.company, c.title, c.email].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const callsByContact = (id) => callLogs.filter(l => l.contact_id === id);

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto w-full">
      <div className="flex items-end justify-between mb-5 sm:mb-6 flex-col sm:flex-row gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Contacts</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{contacts.length} in your network</p>
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <Button onClick={() => setQuickAddOpen(true)} className="ml-auto"><Plus className="h-4 w-4" />Add</Button>
        </div>
      </div>

      <Card className="mb-4">
        <CardContent className="p-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <Input className="pl-9 h-9" placeholder="Search by name, company, title…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No contacts yet"
          description="Build your network of recruiters, hiring managers, and referrers."
          action={<Button onClick={() => setQuickAddOpen(true)}><Plus className="h-4 w-4" />Add contact</Button>}
        />
      ) : (
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4"
          initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.04 } } }}
        >
          {filtered.map(c => (
            <motion.div key={c.id} variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }} layout>
              <Card hover className="cursor-pointer" onClick={() => setSelected(c)}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarFallback className="bg-gradient-to-br from-[var(--primary)] to-[color-mix(in_oklab,var(--primary)_70%,black)] text-white">{getInitials(c.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold leading-tight truncate">{c.name}</div>
                      <div className="text-sm text-[var(--muted-foreground)] truncate">{c.title || 'Contact'}{c.company && ` · ${c.company}`}</div>
                    </div>
                    {callsByContact(c.id).length > 0 && (
                      <Badge variant="info" className="shrink-0"><MessageSquare className="h-3 w-3" />{callsByContact(c.id).length}</Badge>
                    )}
                  </div>
                  <div className="mt-3 flex flex-col gap-1.5 text-sm text-[var(--muted-foreground)]">
                    {c.email && <div className="flex items-center gap-2 truncate"><Mail className="h-3.5 w-3.5 shrink-0" />{c.email}</div>}
                    {c.phone && <div className="flex items-center gap-2 truncate"><Phone className="h-3.5 w-3.5 shrink-0" />{c.phone}</div>}
                  </div>
                  <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
                    <span className="text-[var(--muted-foreground)]">Added {timeAgo(c.created_at)}</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs">View →</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <ContactDetail
        contact={selected}
        calls={selected ? callsByContact(selected.id) : []}
        onClose={() => setSelected(null)}
        onEdit={() => { setEditing(selected); setSelected(null); }}
        onLogCall={() => setLogCallFor(selected)}
        onDelete={async () => { await remove(selected.id); toast.success('Contact deleted'); setSelected(null); refetch(); }}
      />

      <EditContactDialog
        contact={editing}
        onClose={() => setEditing(null)}
        onSave={async (patch) => { await update(editing.id, patch); refetch(); setEditing(null); toast.success('Saved'); }}
      />

      <LogCallDialog
        contact={logCallFor}
        onClose={() => setLogCallFor(null)}
        onSave={async (data) => {
          try {
            await insertCall({ ...data, contact_id: logCallFor.id, call_date: new Date().toISOString() });
            await log('called', 'contact', logCallFor.id, `Called ${logCallFor.name} — ${data.outcome}`);
            toast.success('Call logged');
            setLogCallFor(null);
            refetchLogs();
          } catch (e) { toast.error(e.message); }
        }}
      />
    </div>
  );
}

function ContactDetail({ contact, calls, onClose, onEdit, onLogCall, onDelete }) {
  if (!contact) return null;
  return (
    <Dialog open={!!contact} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-gradient-to-br from-[var(--primary)] to-[color-mix(in_oklab,var(--primary)_70%,black)] text-white text-base">{getInitials(contact.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <DialogTitle>{contact.name}</DialogTitle>
              <DialogDescription>{contact.title}{contact.company && ` · ${contact.company}`}</DialogDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={onEdit}><Pencil />Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-[var(--destructive)] focus:text-[var(--destructive)]"><Trash2 />Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {contact.email && <DetailLink icon={Mail} label="Email" value={contact.email} href={`mailto:${contact.email}`} />}
          {contact.phone && <DetailLink icon={Phone} label="Phone" value={contact.phone} href={`tel:${contact.phone}`} />}
          {contact.linkedin_url && <DetailLink icon={LinkedinIcon} label="LinkedIn" value="View profile" href={contact.linkedin_url} external />}
          {contact.company && <DetailLink icon={Building2} label="Company" value={contact.company} />}
        </div>

        {contact.notes && (
          <div>
            <Label>Private notes</Label>
            <p className="text-sm text-[var(--muted-foreground)] mt-1.5 whitespace-pre-wrap leading-relaxed">{contact.notes}</p>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Call history ({calls.length})</Label>
            <Button size="sm" onClick={onLogCall}><Phone className="h-3.5 w-3.5" />Log call</Button>
          </div>
          {calls.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] italic">No calls logged.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {calls.map(call => (
                <div key={call.id} className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/40 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant={call.outcome === 'connected' ? 'success' : 'outline'}>{call.outcome.replace(/_/g, ' ')}</Badge>
                    <span className="text-xs text-[var(--muted-foreground)]">{formatDateTime(call.call_date)}</span>
                  </div>
                  {call.duration_minutes && <div className="text-xs text-[var(--muted-foreground)]">{call.duration_minutes} min</div>}
                  {call.notes && <p className="text-sm mt-1 italic">"{call.notes}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailLink({ icon: Icon, label, value, href, external }) {
  const inner = (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/40 p-3 flex items-center gap-3 hover:bg-[var(--secondary)] transition-colors">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--accent)] text-[var(--primary)]"><Icon className="h-4 w-4" /></span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">{label}</div>
        <div className="text-sm font-medium truncate">{value}</div>
      </div>
      {external && <ExternalLink className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />}
    </div>
  );
  return href ? <a href={href} target={external ? '_blank' : undefined} rel="noreferrer">{inner}</a> : inner;
}

function EditContactDialog({ contact, onClose, onSave }) {
  const [form, setForm] = useState({});
  useEffect(() => { if (contact) setForm(contact); }, [contact]);
  if (!contact) return null;
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <Dialog open={!!contact} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit contact</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Name"><Input value={form.name || ''} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="Title"><Input value={form.title || ''} onChange={(e) => set('title', e.target.value)} /></Field>
          <Field label="Company"><Input value={form.company || ''} onChange={(e) => set('company', e.target.value)} /></Field>
          <Field label="Email"><Input type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label="Phone"><Input value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
          <Field label="LinkedIn"><Input value={form.linkedin_url || ''} onChange={(e) => set('linkedin_url', e.target.value)} /></Field>
        </div>
        <Field label="Notes"><Textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} /></Field>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LogCallDialog({ contact, onClose, onSave }) {
  const [form, setForm] = useState({ outcome: 'connected', duration_minutes: '', notes: '' });
  if (!contact) return null;
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <Dialog open={!!contact} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log call — {contact.name}</DialogTitle>
          <DialogDescription>Capture what happened so you can follow up smartly.</DialogDescription>
        </DialogHeader>
        <Field label="Outcome">
          <Select value={form.outcome} onValueChange={(v) => set('outcome', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CALL_OUTCOMES.map(o => <SelectItem key={o} value={o}>{o.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Duration (minutes)"><Input type="number" value={form.duration_minutes} onChange={(e) => set('duration_minutes', e.target.value)} placeholder="15" /></Field>
        <Field label="Notes"><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="What was discussed…" /></Field>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({ ...form, duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null })}>Save call</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
