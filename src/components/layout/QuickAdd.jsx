import { useState } from 'react';
import { Briefcase, ListChecks, Calendar, Users, PhoneCall, Link2, Loader2, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { useApp } from '../../lib/app-context';
import { useSupabaseCrud, useActivityLog } from '../../hooks/useSupabase';
import { isSupabaseConfigured } from '../../lib/supabase';
import { TASK_PRIORITIES, APP_STATUSES, WORK_MODES, CALL_OUTCOMES } from '../../utils/constants';
import { extractCity } from '../../utils/helpers';
import { scrapeJobUrl } from '../../lib/url-scraper';
import { toast } from '../ui/feedback';

export default function QuickAdd() {
  const { quickAddOpen, setQuickAddOpen } = useApp();
  const [tab, setTab] = useState('application');
  const configured = isSupabaseConfigured();

  return (
    <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Quick add</DialogTitle>
          <DialogDescription>Capture an opportunity, task, contact, outreach call, or interview without leaving your flow.</DialogDescription>
        </DialogHeader>

        {!configured ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-4 text-sm">
            Connect Supabase in <strong>Settings</strong> to enable saving.
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="application"><Briefcase className="h-3.5 w-3.5 mr-1.5" />Job</TabsTrigger>
              <TabsTrigger value="outreach"><PhoneCall className="h-3.5 w-3.5 mr-1.5" />Outreach</TabsTrigger>
              <TabsTrigger value="task"><ListChecks className="h-3.5 w-3.5 mr-1.5" />Task</TabsTrigger>
              <TabsTrigger value="event"><Calendar className="h-3.5 w-3.5 mr-1.5" />Event</TabsTrigger>
              <TabsTrigger value="contact"><Users className="h-3.5 w-3.5 mr-1.5" />Contact</TabsTrigger>
            </TabsList>

            <TabsContent value="application"><ApplicationForm onClose={() => setQuickAddOpen(false)} /></TabsContent>
            <TabsContent value="outreach"><OutreachForm onClose={() => setQuickAddOpen(false)} /></TabsContent>
            <TabsContent value="task"><TaskForm onClose={() => setQuickAddOpen(false)} /></TabsContent>
            <TabsContent value="event"><EventForm onClose={() => setQuickAddOpen(false)} /></TabsContent>
            <TabsContent value="contact"><ContactForm onClose={() => setQuickAddOpen(false)} /></TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ApplicationForm({ onClose }) {
  const { insert } = useSupabaseCrud('applications');
  const log = useActivityLog();
  const [form, setForm] = useState({
    job_title: '', company: '', location: '', salary_min: '', salary_max: '',
    status: 'applied', source_url: '', work_mode: '', description: '',
  });
  const [fetching, setFetching] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const fetchUrl = async () => {
    if (!form.source_url.trim()) return toast.error('Paste a job URL first');
    setFetching(true);
    try {
      const data = await scrapeJobUrl(form.source_url.trim());
      setForm(prev => ({
        ...prev,
        job_title: data.title || prev.job_title,
        company: data.company || prev.company,
        location: data.location || prev.location,
        description: data.description || prev.description,
        salary_min: data.salaryMin ? String(data.salaryMin) : prev.salary_min,
        salary_max: data.salaryMax ? String(data.salaryMax) : prev.salary_max,
        work_mode: data.workMode || prev.work_mode,
        source_site: data.sourceSite || prev.source_site,
      }));
      toast.success('Job info pulled from URL');
    } catch (e) {
      toast.error(e.message || 'Could not fetch URL');
    }
    setFetching(false);
  };

  const submit = async () => {
    if (!form.job_title || !form.company) return toast.error('Title and company required');
    try {
      const record = {
        ...form,
        city: extractCity(form.location),
        salary_min: form.salary_min ? parseInt(form.salary_min) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max) : null,
        work_mode: form.work_mode || null,
      };
      // Auto-set applied_date when status is 'applied' or beyond
      if (['applied', 'phone_screen', 'interview', 'offer'].includes(form.status)) {
        record.applied_date = new Date().toISOString();
      }
      await insert(record);
      await log('saved', 'application', null, `Added "${form.job_title}" at ${form.company}`);
      toast.success('Application added');
      onClose();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="grid gap-4 mt-4">
      {/* URL auto-fetch */}
      <div>
        <Label>Job URL — paste a link to auto-fill</Label>
        <div className="flex gap-2 mt-1.5">
          <Input
            value={form.source_url}
            onChange={(e) => set('source_url', e.target.value)}
            placeholder="https://linkedin.com/jobs/view/..."
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), fetchUrl())}
          />
          <Button type="button" variant="outline" onClick={fetchUrl} disabled={fetching} className="shrink-0">
            {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {fetching ? 'Pulling…' : 'Fetch'}
          </Button>
        </div>
        <p className="text-[11px] text-[var(--muted-foreground)] mt-1">We'll try to pull job title, company, location, and description automatically.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Job title *"><Input value={form.job_title} onChange={(e) => set('job_title', e.target.value)} placeholder="Senior Engineer" autoFocus /></Field>
        <Field label="Company *"><Input value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="Acme Inc" /></Field>
        <Field label="Location"><Input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="San Francisco, CA" /></Field>
        <Field label="Status">
          <Select value={form.status} onValueChange={(v) => set('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{APP_STATUSES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Work mode">
          <Select value={form.work_mode || 'none'} onValueChange={(v) => set('work_mode', v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not specified</SelectItem>
              {WORK_MODES.map((m) => <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Salary range">
          <div className="flex gap-2">
            <Input type="number" value={form.salary_min} onChange={(e) => set('salary_min', e.target.value)} placeholder="Min" />
            <Input type="number" value={form.salary_max} onChange={(e) => set('salary_max', e.target.value)} placeholder="Max" />
          </div>
        </Field>
      </div>
      {form.description && (
        <Field label="Description (fetched)">
          <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className="text-xs" />
        </Field>
      )}
      <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit}>Add application</Button></div>
    </div>
  );
}

function OutreachForm({ onClose }) {
  const { insert: insertContact } = useSupabaseCrud('contacts');
  const { insert: insertCall } = useSupabaseCrud('call_logs');
  const log = useActivityLog();
  const [form, setForm] = useState({
    company: '', contactName: '', phone: '', email: '',
    outcome: 'connected', duration_minutes: '', notes: '',
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.company) return toast.error('Company name required');
    try {
      // Create or find a contact for this outreach
      const contactData = {
        name: form.contactName || `${form.company} Contact`,
        company: form.company,
        phone: form.phone || null,
        email: form.email || null,
      };
      const contact = await insertContact(contactData);

      // Log the call
      await insertCall({
        contact_id: contact.id,
        call_date: new Date().toISOString(),
        outcome: form.outcome,
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
        notes: form.notes || null,
      });

      await log('outreach', 'contact', contact.id, `Called ${form.company} — ${form.outcome.replace(/_/g, ' ')}`);
      toast.success(`Outreach to ${form.company} logged`);
      onClose();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="grid gap-4 mt-4">
      <p className="text-sm text-[var(--muted-foreground)] -mt-2">
        Quickly log a call you've made to a company. We'll save the contact and call record together.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Company *"><Input value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="Acme Corp" autoFocus /></Field>
        <Field label="Contact name"><Input value={form.contactName} onChange={(e) => set('contactName', e.target.value)} placeholder="John Smith (optional)" /></Field>
        <Field label="Phone number"><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(555) 123-4567" /></Field>
        <Field label="Email"><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="hr@company.com" /></Field>
        <Field label="Outcome">
          <Select value={form.outcome} onValueChange={(v) => set('outcome', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CALL_OUTCOMES.map(o => <SelectItem key={o} value={o}>{o.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Duration (minutes)"><Input type="number" value={form.duration_minutes} onChange={(e) => set('duration_minutes', e.target.value)} placeholder="5" /></Field>
      </div>
      <Field label="Notes"><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="What was discussed, follow-up actions…" /></Field>
      <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit}><PhoneCall className="h-4 w-4" />Log outreach</Button></div>
    </div>
  );
}

function TaskForm({ onClose }) {
  const { insert } = useSupabaseCrud('tasks');
  const [form, setForm] = useState({ title: '', notes: '', priority: 'normal', due_date: '' });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const submit = async () => {
    if (!form.title) return toast.error('Title required');
    try {
      await insert({ ...form, due_date: form.due_date ? new Date(form.due_date).toISOString() : null });
      toast.success('Task added');
      onClose();
    } catch (e) { toast.error(e.message); }
  };
  return (
    <div className="grid gap-4 mt-4">
      <Field label="Title *"><Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Follow up with recruiter" autoFocus /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Priority">
          <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TASK_PRIORITIES.map((p) => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Due date"><Input type="datetime-local" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} /></Field>
      </div>
      <Field label="Notes"><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Optional context…" /></Field>
      <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit}>Add task</Button></div>
    </div>
  );
}

function EventForm({ onClose }) {
  const { insert } = useSupabaseCrud('events');
  const [form, setForm] = useState({ title: '', starts_at: '', ends_at: '', location: '', meeting_link: '', kind: 'interview', notes: '' });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const submit = async () => {
    if (!form.title || !form.starts_at) return toast.error('Title and start time required');
    try {
      await insert({
        ...form,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      });
      toast.success('Event added');
      onClose();
    } catch (e) { toast.error(e.message); }
  };
  return (
    <div className="grid gap-4 mt-4">
      <Field label="Title *"><Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Phone screen with Acme" autoFocus /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Starts *"><Input type="datetime-local" value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)} /></Field>
        <Field label="Ends"><Input type="datetime-local" value={form.ends_at} onChange={(e) => set('ends_at', e.target.value)} /></Field>
        <Field label="Type">
          <Select value={form.kind} onValueChange={(v) => set('kind', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="phone_screen">Phone screen</SelectItem>
              <SelectItem value="follow_up">Follow up</SelectItem>
              <SelectItem value="networking">Networking</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Location"><Input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="HQ / Remote / address" /></Field>
      </div>
      <Field label="Meeting link"><Input value={form.meeting_link} onChange={(e) => set('meeting_link', e.target.value)} placeholder="https://meet…" /></Field>
      <Field label="Notes"><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
      <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit}>Add event</Button></div>
    </div>
  );
}

function ContactForm({ onClose }) {
  const { insert } = useSupabaseCrud('contacts');
  const log = useActivityLog();
  const [form, setForm] = useState({ name: '', title: '', company: '', email: '', phone: '', linkedin_url: '', notes: '' });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const submit = async () => {
    if (!form.name) return toast.error('Name required');
    try {
      await insert(form);
      await log('added', 'contact', null, `Added contact "${form.name}"`);
      toast.success('Contact added');
      onClose();
    } catch (e) { toast.error(e.message); }
  };
  return (
    <div className="grid gap-4 mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Name *"><Input value={form.name} onChange={(e) => set('name', e.target.value)} autoFocus /></Field>
        <Field label="Title"><Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Hiring Manager" /></Field>
        <Field label="Company"><Input value={form.company} onChange={(e) => set('company', e.target.value)} /></Field>
        <Field label="Email"><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
        <Field label="LinkedIn"><Input value={form.linkedin_url} onChange={(e) => set('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/…" /></Field>
      </div>
      <Field label="Notes"><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
      <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit}>Add contact</Button></div>
    </div>
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
