import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search as SearchIcon, MapPin, AlertCircle, Bookmark, ExternalLink, Sparkles, Building2, Filter,
  ArrowRight, Calendar, Briefcase, Star, Trash2
} from 'lucide-react';
import { isJSearchConfigured, searchJobs } from '../../lib/jsearch';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useSupabaseQuery, useSupabaseCrud, useActivityLog } from '../../hooks/useSupabase';
import { usePersistedState } from '../../hooks/usePersistedState';
import { useApp } from '../../lib/app-context';
import { DATE_FILTERS, EMPLOYMENT_TYPES } from '../../utils/constants';
import { formatSalary, timeAgo, extractCity, truncate } from '../../utils/helpers';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Spinner, EmptyState, toast } from '../ui/feedback';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { cn } from '../../lib/cn';

export default function JobSearch() {
  const { navigate } = useApp();
  const { insert: insertApp } = useSupabaseCrud('applications');
  const { data: savedSearches, refetch: refetchSaved } = useSupabaseQuery('saved_searches');
  const { insert: insertSaved, remove: removeSaved } = useSupabaseCrud('saved_searches');
  const log = useActivityLog();

  // Persist last query / filters across reloads
  const [filters, setFilters] = usePersistedState('search:filters', {
    query: '', location: '', datePosted: 'all', remoteOnly: false, employmentType: '',
  });
  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const { query, location, datePosted, remoteOnly, employmentType } = filters;

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [saveLabel, setSaveLabel] = useState('');
  const [saveOpen, setSaveOpen] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    if (!isJSearchConfigured()) { setError('JSearch API key not configured. Add it in Settings.'); return; }
    setLoading(true); setError(null);
    try {
      const res = await searchJobs({ query, location, datePosted, remoteOnly, employmentType });
      setResults(res.jobs);
      if (!res.jobs.length) setError('No jobs found. Try different keywords or location.');
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const handleSaveSearch = async () => {
    if (!saveLabel.trim() || !query.trim()) return;
    try {
      await insertSaved({
        label: saveLabel.trim(),
        query,
        location,
        job_type: employmentType || null,
        filters: { datePosted, remoteOnly, employmentType },
      });
      toast.success(`Saved "${saveLabel}"`);
      setSaveLabel('');
      setSaveOpen(false);
      refetchSaved();
    } catch (e) { toast.error('Could not save: ' + e.message); }
  };

  const handleLoadSaved = (s) => {
    const f = s.filters || {};
    setFilters({
      query: s.query || '',
      location: s.location || '',
      datePosted: f.datePosted || 'all',
      remoteOnly: !!f.remoteOnly,
      employmentType: f.employmentType || s.job_type || '',
    });
    // run search after state settles
    setTimeout(() => document.getElementById('jobsearch-form')?.requestSubmit?.(), 0);
  };

  const handleDeleteSaved = async (id) => {
    try { await removeSaved(id); refetchSaved(); }
    catch (e) { toast.error(e.message); }
  };

  const saveJob = async (job) => {
    if (!isSupabaseConfigured()) return toast.error('Connect Supabase in Settings to save jobs');
    try {
      await insertApp({
        job_title: job.title, company: job.company, location: job.location,
        city: job.city || extractCity(job.location), state: job.state,
        salary_min: job.salaryMin, salary_max: job.salaryMax,
        employment_type: job.employmentType, work_mode: job.isRemote ? 'remote' : 'on-site',
        status: 'saved', source_url: job.applyLink || job.sourceUrl, source_site: job.sourceSite,
        description: job.description,
      });
      await log('saved', 'application', null, `Saved "${job.title}" at ${job.company}`);
      toast.success(`Saved "${job.title}"`);
    } catch (e) { toast.error('Failed to save: ' + e.message); }
  };

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto w-full">
      <div className="mb-5 sm:mb-7">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Find your next role</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Powered by JSearch — aggregates LinkedIn, Indeed, Glassdoor, ZipRecruiter & more.</p>
      </div>

      <Card className="mb-6 overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <form id="jobsearch-form" onSubmit={handleSearch} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_auto] gap-2">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                <Input className="pl-9 h-11" placeholder="Job title, keyword, or company" value={query} onChange={(e) => setFilter('query', e.target.value)} />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                <Input className="pl-9 h-11" placeholder="City, state, or 'remote'" value={location} onChange={(e) => setFilter('location', e.target.value)} />
              </div>
              <Button type="submit" size="lg" disabled={loading} className="h-11">
                {loading ? <Spinner /> : <><SearchIcon className="h-4 w-4" />Search</>}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5"><Filter className="h-3 w-3" />Filters</span>
              <Select value={datePosted} onValueChange={(v) => setFilter('datePosted', v)}>
                <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{DATE_FILTERS.map((f) => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={employmentType || 'any'} onValueChange={(v) => setFilter('employmentType', v === 'any' ? '' : v.toUpperCase())}>
                <SelectTrigger className="h-8 w-auto min-w-[110px] text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any type</SelectItem>
                  {EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t.replace('-', '').toUpperCase()}>{t}</SelectItem>)}
                </SelectContent>
              </Select>

              {isSupabaseConfigured() && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="h-8 text-xs">
                      <Star className="h-3 w-3" />Saved {savedSearches?.length ? `(${savedSearches.length})` : ''}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[260px]">
                    <DropdownMenuLabel>Saved searches</DropdownMenuLabel>
                    {(!savedSearches || savedSearches.length === 0) ? (
                      <div className="px-2 py-2 text-xs text-[var(--muted-foreground)]">No saved searches yet.</div>
                    ) : (
                      savedSearches.map((s) => (
                        <DropdownMenuItem key={s.id} onClick={() => handleLoadSaved(s)} className="flex items-start gap-2 group">
                          <Star className="h-3.5 w-3.5 mt-0.5 text-[var(--primary)]" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{s.label}</div>
                            <div className="text-[11px] text-[var(--muted-foreground)] truncate">{s.query}{s.location ? ` · ${s.location}` : ''}</div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteSaved(s.id); }}
                            className="opacity-0 group-hover:opacity-100 text-[var(--muted-foreground)] hover:text-[var(--destructive)] p-1 rounded"
                            aria-label="Delete saved search"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </DropdownMenuItem>
                      ))
                    )}
                    <DropdownMenuSeparator />
                    <div className="p-2 flex gap-1.5">
                      <Input
                        placeholder="Name this search…"
                        value={saveLabel}
                        onChange={(e) => setSaveLabel(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveSearch(); } }}
                        className="h-8 text-xs"
                      />
                      <Button type="button" size="sm" className="h-8" onClick={handleSaveSearch} disabled={!saveLabel.trim() || !query.trim()}>Save</Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <div className="ml-auto flex items-center gap-2">
                <Label htmlFor="remote-toggle" className="cursor-pointer">Remote only</Label>
                <Switch id="remote-toggle" checked={remoteOnly} onCheckedChange={(v) => setFilter('remoteOnly', v)} />
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-[var(--destructive)]/40 bg-[var(--destructive)]/10">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 mt-0.5 text-[var(--destructive)] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--destructive)]">{error}</p>
              {error.toLowerCase().includes('settings') && (
                <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('settings')}>Open Settings</Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      )}

      {!loading && results.length > 0 && (
        <>
          <div className="text-xs text-[var(--muted-foreground)] mb-3">{results.length} results</div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.04 } } }}
          >
            {results.map((job) => <JobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} onSave={() => saveJob(job)} />)}
          </motion.div>
        </>
      )}

      {!loading && results.length === 0 && !error && (
        <EmptyState
          icon={Sparkles}
          title="Start your hunt"
          description="Search across 100+ job boards. Tip: try specific job titles like 'Senior React Engineer' or 'HVAC Technician' for the best results."
          action={<Button onClick={() => document.querySelector('input')?.focus()}><SearchIcon className="h-4 w-4" />Begin search</Button>}
          className="mt-12"
        />
      )}

      <JobDetailDialog job={selectedJob} onClose={() => setSelectedJob(null)} onSave={(j) => { saveJob(j); setSelectedJob(null); }} />
    </div>
  );
}

const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } };

function JobCard({ job, onClick, onSave }) {
  return (
    <motion.div variants={item} layout>
      <Card hover className="h-full cursor-pointer flex flex-col" onClick={onClick}>
        <CardContent className="p-4 sm:p-5 flex flex-col h-full">
          <div className="flex items-start gap-3 mb-3">
            {job.companyLogo ? (
              <img src={job.companyLogo} alt="" className="h-10 w-10 rounded-lg object-contain bg-white p-1" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-[var(--accent)] text-[var(--muted-foreground)] flex items-center justify-center"><Building2 className="h-4 w-4" /></div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold leading-tight truncate">{job.title}</h3>
              <p className="text-sm text-[var(--primary)] truncate font-medium">{job.company}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {job.location && <Badge variant="outline"><MapPin className="h-3 w-3" />{truncate(job.location, 28)}</Badge>}
            {job.isRemote && <Badge variant="success">Remote</Badge>}
            {job.employmentType && <Badge variant="info">{job.employmentType}</Badge>}
            {formatSalary(job.salaryMin, job.salaryMax) && <Badge variant="warning">{formatSalary(job.salaryMin, job.salaryMax)}</Badge>}
          </div>

          <p className="text-xs text-[var(--muted-foreground)] line-clamp-3 leading-relaxed flex-1">{job.description}</p>

          <div className="mt-4 pt-3 flex items-center justify-between border-t border-[var(--border)]">
            <span className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1.5"><Calendar className="h-3 w-3" />{timeAgo(job.postedDate)} · {job.sourceSite}</span>
            <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" onClick={onSave} className="h-7"><Bookmark className="h-3 w-3" />Save</Button>
              {job.applyLink && (
                <Button size="sm" asChild className="h-7">
                  <a href={job.applyLink} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3" />Apply</a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function JobDetailDialog({ job, onClose, onSave }) {
  return (
    <Dialog open={!!job} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        {job && (
          <>
            <DialogHeader>
              <div className="flex gap-3 items-start">
                {job.companyLogo ? (
                  <img src={job.companyLogo} alt="" className="h-12 w-12 rounded-lg object-contain bg-white p-1.5" />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-[var(--accent)] flex items-center justify-center"><Building2 className="h-5 w-5" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <DialogTitle className="leading-snug">{job.title}</DialogTitle>
                  <DialogDescription className="mt-0.5">{job.company} · {job.location}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex flex-wrap gap-1.5">
              {formatSalary(job.salaryMin, job.salaryMax) && <Badge variant="warning">💰 {formatSalary(job.salaryMin, job.salaryMax)}</Badge>}
              {job.employmentType && <Badge variant="info"><Briefcase className="h-3 w-3" />{job.employmentType}</Badge>}
              {job.isRemote && <Badge variant="success">Remote</Badge>}
              {job.postedDate && <Badge variant="outline"><Calendar className="h-3 w-3" />{timeAgo(job.postedDate)}</Badge>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[55vh] overflow-y-auto pr-2">
              <div className="space-y-5">
                {job.qualifications?.length > 0 && (
                  <Section title="Qualifications">
                    <ul className="text-sm text-[var(--muted-foreground)] space-y-1.5 list-disc pl-4 leading-relaxed">{job.qualifications.map((q, i) => <li key={i}>{q}</li>)}</ul>
                  </Section>
                )}
                {job.responsibilities?.length > 0 && (
                  <Section title="Responsibilities">
                    <ul className="text-sm text-[var(--muted-foreground)] space-y-1.5 list-disc pl-4 leading-relaxed">{job.responsibilities.map((r, i) => <li key={i}>{r}</li>)}</ul>
                  </Section>
                )}
                {job.benefits?.length > 0 && (
                  <Section title="Benefits">
                    <ul className="text-sm text-[var(--muted-foreground)] space-y-1.5 list-disc pl-4 leading-relaxed">{job.benefits.map((b, i) => <li key={i}>{b}</li>)}</ul>
                  </Section>
                )}
              </div>
              <Section title="About the role">
                <p className="text-sm text-[var(--muted-foreground)] whitespace-pre-wrap leading-relaxed">{job.description}</p>
              </Section>
            </div>

            <DialogFooter className="border-t border-[var(--border)] pt-4">
              <Button variant="ghost" onClick={onClose}>Close</Button>
              <Button variant="outline" onClick={() => onSave(job)}><Bookmark className="h-4 w-4" />Save to board</Button>
              {job.applyLink && (
                <Button asChild>
                  <a href={job.applyLink} target="_blank" rel="noreferrer">Apply now <ArrowRight className="h-4 w-4" /></a>
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">{title}</h4>
      {children}
    </div>
  );
}
