import { useState } from 'react';
import { saveSupabaseConfig, isSupabaseConfigured, getSupabase, INIT_SQL } from '../../lib/supabase';
import { isJSearchConfigured } from '../../lib/jsearch';
import { useToast } from '../ui/UI';

export default function Settings() {
  const addToast = useToast();
  const [supabaseUrl, setSupabaseUrl] = useState(localStorage.getItem('jobtracker_supabase_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(localStorage.getItem('jobtracker_supabase_key') || '');
  const [rapidApiKey, setRapidApiKey] = useState(localStorage.getItem('jobtracker_rapidapi_key') || '');
  const [showSql, setShowSql] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleSaveSupabase = () => {
    saveSupabaseConfig(supabaseUrl.trim(), supabaseKey.trim());
    addToast('Supabase config saved!', 'success');
  };

  const handleSaveRapidApi = () => {
    localStorage.setItem('jobtracker_rapidapi_key', rapidApiKey.trim());
    addToast('RapidAPI key saved!', 'success');
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase not configured');
      const { error } = await sb.from('applications').select('id').limit(1);
      if (error) throw error;
      addToast('✅ Connected successfully!', 'success');
    } catch (e) {
      addToast('❌ Connection failed: ' + e.message, 'error');
    }
    setTesting(false);
  };

  const handleExport = async () => {
    try {
      const sb = getSupabase();
      if (!sb) throw new Error('Not configured');
      const tables = ['applications', 'contacts', 'call_logs', 'resumes', 'resume_submissions', 'saved_searches', 'activity_log'];
      const data = {};
      for (const t of tables) {
        const { data: rows } = await sb.from(t).select('*');
        data[t] = rows || [];
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `jobtracker_backup_${new Date().toISOString().slice(0, 10)}.json`; a.click();
      URL.revokeObjectURL(url);
      addToast('Data exported!', 'success');
    } catch (e) { addToast('Export failed: ' + e.message, 'error'); }
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
      addToast('Data imported successfully!', 'success');
    } catch (e) { addToast('Import failed: ' + e.message, 'error'); }
  };

  return (
    <div className="page-content">
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Settings</h1>
      <p className="text-secondary mb-24">Configure your API keys and manage data</p>

      {/* Status */}
      <div className="card mb-24">
        <h3 className="section-title mb-16">Connection Status</h3>
        <div className="flex gap-16">
          <div className="flex items-center gap-8">
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: isSupabaseConfigured() ? 'var(--success)' : 'var(--danger)' }} />
            <span className="text-sm">Supabase {isSupabaseConfigured() ? 'Connected' : 'Not configured'}</span>
          </div>
          <div className="flex items-center gap-8">
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: isJSearchConfigured() ? 'var(--success)' : 'var(--danger)' }} />
            <span className="text-sm">JSearch API {isJSearchConfigured() ? 'Connected' : 'Not configured'}</span>
          </div>
        </div>
      </div>

      {/* Supabase Config */}
      <div className="card mb-24">
        <h3 className="section-title mb-16">🗄 Supabase Database</h3>
        <p className="text-secondary text-sm mb-16">
          Sign up free at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>supabase.com</a> → Create a project → Find your URL and anon key in Project Settings → API.
        </p>
        <div className="flex flex-col gap-16">
          <div className="form-group">
            <label className="form-label">Project URL</label>
            <input className="input" value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} placeholder="https://xxxxx.supabase.co" />
          </div>
          <div className="form-group">
            <label className="form-label">Anon Key</label>
            <input className="input" type="password" value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} placeholder="eyJhbGciOiJI..." />
          </div>
          <div className="flex gap-8">
            <button className="btn btn-primary" onClick={handleSaveSupabase}>Save</button>
            <button className="btn btn-secondary" onClick={handleTestConnection} disabled={testing}>{testing ? '⏳ Testing...' : '🔌 Test Connection'}</button>
            <button className="btn btn-secondary" onClick={() => setShowSql(!showSql)}>📋 {showSql ? 'Hide' : 'Show'} Setup SQL</button>
          </div>
        </div>
        {showSql && (
          <div className="mt-16">
            <p className="text-secondary text-sm mb-8">Run this SQL in your Supabase dashboard → SQL Editor → New Query:</p>
            <div style={{ background: 'var(--bg-primary)', padding: 16, borderRadius: 'var(--radius-sm)', maxHeight: 300, overflow: 'auto' }}>
              <pre style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{INIT_SQL}</pre>
            </div>
            <button className="btn btn-sm btn-secondary mt-8" onClick={() => { navigator.clipboard.writeText(INIT_SQL); addToast('SQL copied to clipboard!', 'success'); }}>📋 Copy SQL</button>
          </div>
        )}
      </div>

      {/* RapidAPI Config */}
      <div className="card mb-24">
        <h3 className="section-title mb-16">🔍 JSearch API (Job Search)</h3>
        <p className="text-secondary text-sm mb-16">
          Sign up free at <a href="https://rapidapi.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>rapidapi.com</a> → Subscribe to <a href="https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch/pricing" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>JSearch free plan</a> (200 searches/month) → Copy your API key.
        </p>
        <div className="flex flex-col gap-16">
          <div className="form-group">
            <label className="form-label">RapidAPI Key</label>
            <input className="input" type="password" value={rapidApiKey} onChange={e => setRapidApiKey(e.target.value)} placeholder="Your RapidAPI key..." />
          </div>
          <button className="btn btn-primary" onClick={handleSaveRapidApi} style={{ alignSelf: 'flex-start' }}>Save</button>
        </div>
      </div>

      {/* Data Management */}
      <div className="card">
        <h3 className="section-title mb-16">💾 Data Management</h3>
        <div className="flex gap-12">
          <button className="btn btn-secondary" onClick={handleExport}>⬇ Export Backup</button>
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            ⬆ Import Backup
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
        </div>
      </div>
    </div>
  );
}
