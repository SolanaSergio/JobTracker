import { useState } from 'react';
import {
  Database, Key, Plug, Download, Upload, ExternalLink, Copy, Check, Sparkles,
  Sun, Moon, Monitor, Eye, EyeOff
} from 'lucide-react';
import { saveSupabaseConfig, isSupabaseConfigured, getSupabase, INIT_SQL } from '../../lib/supabase';
import { isJSearchConfigured } from '../../lib/jsearch';
import { useTheme } from '../../lib/theme';
import { usePersistedState } from '../../hooks/usePersistedState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { toast } from '../ui/feedback';
import { cn } from '../../lib/cn';

export default function Settings() {
  const [tab, setTab] = usePersistedState('settings:tab', 'connections');
  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-4xl mx-auto w-full">
      <div className="mb-5 sm:mb-7">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Connect services, manage data, and personalize the app</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-3 w-full sm:w-auto sm:inline-flex">
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4 mt-6">
          <ConnectionStatus />
          <SupabaseSection />
          <JSearchSection />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4 mt-6">
          <AppearanceSection />
        </TabsContent>

        <TabsContent value="data" className="space-y-4 mt-6">
          <DataSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ConnectionStatus() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Status</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-3">
        <StatusPill label="Supabase database" connected={isSupabaseConfigured()} />
        <StatusPill label="JSearch API" connected={isJSearchConfigured()} />
      </CardContent>
    </Card>
  );
}

function StatusPill({ label, connected }) {
  return (
    <div className="flex-1 flex items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/40 p-3">
      <span className={cn('h-2 w-2 rounded-full', connected ? 'bg-[var(--success)] pulse-soft' : 'bg-[var(--destructive)]')} />
      <span className="text-sm flex-1">{label}</span>
      <Badge variant={connected ? 'success' : 'destructive'}>{connected ? 'Connected' : 'Not configured'}</Badge>
    </div>
  );
}

function SupabaseSection() {
  const [url, setUrl] = useState(localStorage.getItem('jobtracker_supabase_url') || '');
  const [key, setKey] = useState(localStorage.getItem('jobtracker_supabase_key') || '');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [copied, setCopied] = useState(false);

  const save = () => {
    saveSupabaseConfig(url.trim(), key.trim());
    toast.success('Supabase config saved');
  };

  const test = async () => {
    setTesting(true);
    try {
      const sb = getSupabase();
      if (!sb) throw new Error('Not configured');
      const { error } = await sb.from('applications').select('id').limit(1);
      if (error) throw error;
      toast.success('Connected successfully');
    } catch (e) { toast.error('Connection failed: ' + e.message); }
    setTesting(false);
  };

  const copySql = async () => {
    await navigator.clipboard.writeText(INIT_SQL);
    setCopied(true);
    toast.success('SQL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--success)_15%,transparent)] text-[var(--success)]">
            <Database className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <CardTitle className="text-base">Supabase database</CardTitle>
            <CardDescription>Free tier is plenty. Sign up at supabase.com → new project → copy URL + anon key.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <a href="https://supabase.com" target="_blank" rel="noreferrer">supabase.com <ExternalLink className="h-3 w-3" /></a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <Field label="Project URL"><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://xxxxx.supabase.co" /></Field>
          <Field label="Anon key">
            <div className="relative">
              <Input type={showKey ? 'text' : 'password'} value={key} onChange={(e) => setKey(e.target.value)} placeholder="eyJhbGciOiJI..." className="pr-10" />
              <button onClick={() => setShowKey((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]" aria-label="Toggle visibility" type="button">
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={save}>Save</Button>
          <Button variant="outline" onClick={test} disabled={testing}><Plug className="h-4 w-4" />{testing ? 'Testing…' : 'Test connection'}</Button>
          <Button variant="outline" onClick={() => setShowSql((v) => !v)}>{showSql ? 'Hide' : 'Show'} setup SQL</Button>
        </div>

        {showSql && (
          <div className="space-y-2">
            <p className="text-xs text-[var(--muted-foreground)]">Run this in Supabase → SQL Editor → New query.</p>
            <ScrollArea className="h-72 rounded-lg border border-[var(--border)] bg-[var(--background)]">
              <pre className="text-[11px] leading-relaxed text-[var(--muted-foreground)] p-4 font-mono whitespace-pre-wrap">{INIT_SQL}</pre>
            </ScrollArea>
            <Button size="sm" variant="outline" onClick={copySql}>{copied ? <><Check className="h-3.5 w-3.5" />Copied</> : <><Copy className="h-3.5 w-3.5" />Copy SQL</>}</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function JSearchSection() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('jobtracker_rapidapi_key') || '');
  const [showKey, setShowKey] = useState(false);
  const save = () => {
    localStorage.setItem('jobtracker_rapidapi_key', apiKey.trim());
    toast.success('API key saved');
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--info)_15%,transparent)] text-[var(--info)]">
            <Key className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <CardTitle className="text-base">JSearch API (Job Search)</CardTitle>
            <CardDescription>Free tier provides 200 searches/month across LinkedIn, Indeed, Glassdoor and more.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <a href="https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch" target="_blank" rel="noreferrer">RapidAPI <ExternalLink className="h-3 w-3" /></a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Field label="RapidAPI key">
          <div className="relative">
            <Input type={showKey ? 'text' : 'password'} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Your RapidAPI key…" className="pr-10" />
            <button onClick={() => setShowKey((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]" aria-label="Toggle visibility" type="button">
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <Button onClick={save}>Save</Button>
      </CardContent>
    </Card>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const options = [
    { key: 'light', label: 'Light', icon: Sun },
    { key: 'dark', label: 'Dark', icon: Moon },
    { key: 'system', label: 'System', icon: Monitor },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Theme</CardTitle>
        <CardDescription>Choose how the app looks. Light mode pairs a warm paper background with a refined emerald accent.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {options.map(opt => {
            const Icon = opt.icon;
            const active = theme === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setTheme(opt.key)}
                className={cn(
                  'group flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                  active ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)] hover:bg-[var(--accent)]'
                )}
              >
                <span className={cn('flex h-10 w-10 items-center justify-center rounded-lg', active ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-[var(--secondary)] text-[var(--muted-foreground)]')}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function DataSection() {
  const handleExport = async () => {
    try {
      const sb = getSupabase();
      if (!sb) throw new Error('Not configured');
      const tables = ['applications', 'contacts', 'call_logs', 'resumes', 'resume_submissions', 'saved_searches', 'activity_log', 'tasks', 'events'];
      const data = {};
      for (const t of tables) {
        const { data: rows } = await sb.from(t).select('*');
        data[t] = rows || [];
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `jobtracker_backup_${new Date().toISOString().slice(0, 10)}.json`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded');
    } catch (e) { toast.error('Export failed: ' + e.message); }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const sb = getSupabase();
      if (!sb) throw new Error('Not configured');
      for (const [table, rows] of Object.entries(data)) {
        if (rows.length > 0) {
          const { error } = await sb.from(table).upsert(rows, { onConflict: 'id' });
          if (error) console.warn(`Import ${table}:`, error);
        }
      }
      toast.success('Data imported');
    } catch (e) { toast.error('Import failed: ' + e.message); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Backup & restore</CardTitle>
        <CardDescription>Export everything to JSON or restore from a previous backup.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4" />Export backup</Button>
        <label className="inline-flex">
          <Button variant="outline" asChild>
            <span><Upload className="h-4 w-4" />Import backup</span>
          </Button>
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>
      </CardContent>
    </Card>
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
