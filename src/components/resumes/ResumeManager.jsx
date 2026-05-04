import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Upload, FileText, Plus, Download, Trash2, Send, Building2, Target
} from 'lucide-react';
import { useSupabaseQuery, useSupabaseCrud, useActivityLog } from '../../hooks/useSupabase';
import { usePersistedState } from '../../hooks/usePersistedState';
import { isSupabaseConfigured, getSupabase } from '../../lib/supabase';
import { useApp } from '../../lib/app-context';
import { SUBMISSION_METHODS } from '../../utils/constants';
import { formatDate, timeAgo } from '../../utils/helpers';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { EmptyState, PageLoader, Spinner, toast } from '../ui/feedback';

export default function ResumeManager() {
  const configured = isSupabaseConfigured();
  const { navigate } = useApp();
  const { data: resumes, loading, refetch } = useSupabaseQuery('resumes');
  const { data: submissions, refetch: refetchSubs } = useSupabaseQuery('resume_submissions', { orderBy: 'submitted_date', ascending: false });
  const { insert: insertResume, remove: removeResume } = useSupabaseCrud('resumes');
  const { insert: insertSub } = useSupabaseCrud('resume_submissions');
  const log = useActivityLog();

  const [tab, setTab] = usePersistedState('resumes:tab', 'versions');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);

  if (!configured) return (
    <div className="px-4 sm:px-8 py-10 max-w-3xl mx-auto"><EmptyState icon={FileText} title="Connect Supabase first"
      description="Manage tailored resumes and track where you've sent each version."
      action={<Button onClick={() => navigate('settings')}>Open Settings</Button>}
    /></div>
  );
  if (loading && resumes.length === 0) return <PageLoader />;

  const handleDownload = async (resume) => {
    try {
      const sb = getSupabase();
      const { data, error } = await sb.storage.from('resumes').download(resume.file_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a'); a.href = url; a.download = resume.file_name; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { toast.error('Download failed: ' + e.message); }
  };

  const handleDelete = async (id) => {
    try { await removeResume(id); toast.success('Resume deleted'); refetch(); }
    catch (e) { toast.error(e.message); }
  };

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto w-full">
      <div className="flex items-end justify-between mb-5 sm:mb-6 flex-col sm:flex-row gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Resumes</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Tailor versions per industry and track every submission</p>
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <Button variant="outline" onClick={() => setTrackOpen(true)}><Send className="h-4 w-4" />Track</Button>
          <Button onClick={() => setUploadOpen(true)} className="ml-auto"><Plus className="h-4 w-4" />Upload</Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-5">
        <TabsList>
          <TabsTrigger value="versions">Versions <Badge variant="outline" className="ml-1.5">{resumes.length}</Badge></TabsTrigger>
          <TabsTrigger value="submissions">Submissions <Badge variant="outline" className="ml-1.5">{submissions.length}</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value="versions">
          {resumes.length === 0 ? (
            <EmptyState icon={FileText} title="No resumes yet"
              description="Upload PDFs to keep different versions handy — chronological, functional, or industry-specific."
              action={<Button onClick={() => setUploadOpen(true)}><Upload className="h-4 w-4" />Upload first resume</Button>}
            />
          ) : (
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4"
              initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.04 } } }}
            >
              {resumes.map(r => {
                const subs = submissions.filter(s => s.resume_id === r.id);
                return (
                  <motion.div key={r.id} variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }} layout>
                    <Card hover>
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--info)_15%,transparent)] text-[var(--info)]">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold leading-tight truncate">{r.label}</div>
                            <div className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">{r.file_name} · {(r.file_size / 1024).toFixed(0)} KB</div>
                          </div>
                          <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(r.id)} aria-label="Delete"><Trash2 /></Button>
                        </div>
                        {r.target_industry && <Badge variant="info" className="mt-3"><Target className="h-3 w-3" />{r.target_industry}</Badge>}
                        {r.notes && <p className="text-sm text-[var(--muted-foreground)] italic mt-3 line-clamp-2">"{r.notes}"</p>}
                        <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                          <span className="text-xs text-[var(--muted-foreground)]">Sent to {subs.length} {subs.length === 1 ? 'co.' : 'co\'s'}</span>
                          <Button variant="outline" size="sm" onClick={() => handleDownload(r)}><Download className="h-3.5 w-3.5" />Download</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="submissions">
          {submissions.length === 0 ? (
            <EmptyState icon={Send} title="No submissions tracked yet"
              description="Track which resume version you sent to each company."
              action={<Button onClick={() => setTrackOpen(true)}><Plus className="h-4 w-4" />Track submission</Button>}
            />
          ) : (
            <Card>
              <ul className="divide-y divide-[var(--border)]">
                {submissions.map(s => {
                  const resume = resumes.find(r => r.id === s.resume_id);
                  return (
                    <li key={s.id} className="p-3 sm:p-4 flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--primary)]"><Building2 className="h-4 w-4" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold truncate">{s.company}</span>
                          <Badge variant="outline">{s.method.replace(/_/g, ' ')}</Badge>
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                          Sent <span className="text-[var(--primary)] font-medium">{resume?.label || 'deleted version'}</span> · {formatDate(s.submitted_date)} ({timeAgo(s.submitted_date)})
                        </div>
                        {s.notes && <div className="text-sm text-[var(--muted-foreground)] italic mt-1 line-clamp-1">"{s.notes}"</div>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} onUpload={async (form, file) => {
        try {
          const sb = getSupabase();
          const path = `${Date.now()}_${file.name}`;
          const { error: upErr } = await sb.storage.from('resumes').upload(path, file);
          if (upErr) throw upErr;
          await insertResume({ ...form, file_name: file.name, file_path: path, file_size: file.size });
          await log('uploaded', 'resume', null, `Uploaded resume "${form.label}"`);
          toast.success('Uploaded'); setUploadOpen(false); refetch();
        } catch (e) { toast.error(e.message); }
      }} />

      <TrackDialog open={trackOpen} onOpenChange={setTrackOpen} resumes={resumes} onSave={async (form) => {
        try {
          await insertSub({ ...form, submitted_date: new Date().toISOString(), status: 'sent' });
          const r = resumes.find(x => x.id === form.resume_id);
          await log('submitted', 'resume', form.resume_id, `Sent "${r?.label}" to ${form.company}`);
          toast.success('Submission tracked'); setTrackOpen(false); refetchSubs();
        } catch (e) { toast.error(e.message); }
      }} />
    </div>
  );
}

function UploadDialog({ open, onOpenChange, onUpload }) {
  const fileRef = useRef();
  const [form, setForm] = useState({ label: '', target_industry: '', notes: '' });
  const [uploading, setUploading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !form.label) return toast.error('Select a file and enter a label');
    setUploading(true);
    await onUpload(form, file);
    setUploading(false);
    setForm({ label: '', target_industry: '', notes: '' });
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload resume</DialogTitle>
          <DialogDescription>Add a new version of your resume.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="File (PDF / DOC)"><Input ref={fileRef} type="file" accept=".pdf,.doc,.docx" /></Field>
          <Field label="Label *"><Input value={form.label} onChange={(e) => set('label', e.target.value)} placeholder="Senior Engineer — v3" /></Field>
          <Field label="Target industry"><Input value={form.target_industry} onChange={(e) => set('target_industry', e.target.value)} placeholder="Fintech" /></Field>
          <Field label="Notes"><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Highlights distributed systems, removed early-career roles…" /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={uploading}>{uploading ? <Spinner /> : <><Upload className="h-4 w-4" />Upload</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TrackDialog({ open, onOpenChange, resumes, onSave }) {
  const [form, setForm] = useState({ resume_id: '', company: '', method: 'online_portal', notes: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Track submission</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <Field label="Resume *">
            <Select value={form.resume_id} onValueChange={(v) => set('resume_id', v)}>
              <SelectTrigger><SelectValue placeholder="Select resume…" /></SelectTrigger>
              <SelectContent>{resumes.map(r => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Company *"><Input value={form.company} onChange={(e) => set('company', e.target.value)} /></Field>
          <Field label="Method">
            <Select value={form.method} onValueChange={(v) => set('method', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SUBMISSION_METHODS.map(m => <SelectItem key={m} value={m}>{m.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Notes"><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { if (!form.resume_id || !form.company) return toast.error('Resume and company required'); onSave(form); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }) {
  return <div className="flex flex-col gap-1.5"><Label>{label}</Label>{children}</div>;
}
