import { useState } from 'react';
import { useSupabaseQuery, useSupabaseCrud, useActivityLog } from '../../hooks/useSupabase';
import { isSupabaseConfigured } from '../../lib/supabase';
import { APP_STATUSES } from '../../utils/constants';
import { formatDate, formatSalary, truncate, timeAgo } from '../../utils/helpers';
import { useToast, Modal, Badge, EmptyState, Spinner } from '../ui/UI';

export default function ApplicationBoard({ onNavigate }) {
  const configured = isSupabaseConfigured();
  const { data: apps, loading, refetch } = useSupabaseQuery('applications');
  const { update, remove, insert } = useSupabaseCrud('applications');
  const logActivity = useActivityLog();
  const addToast = useToast();
  const [dragId, setDragId] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filterCity, setFilterCity] = useState('');
  const [filterType, setFilterType] = useState('');

  if (!configured) return <div className="page-content"><EmptyState icon="📋" title="Configure Supabase" text="Go to Settings to set up your database." action={<button className="btn btn-primary" onClick={() => onNavigate('settings')}>Settings</button>} /></div>;
  if (loading) return <div className="page-content"><Spinner /></div>;

  const cities = [...new Set(apps.map(a => a.city).filter(Boolean))].sort();
  const jobTypes = [...new Set(apps.map(a => a.job_type).filter(Boolean))].sort();

  let filtered = apps;
  if (filterCity) filtered = filtered.filter(a => a.city === filterCity);
  if (filterType) filtered = filtered.filter(a => a.job_type === filterType);

  const handleDrop = async (status) => {
    if (!dragId) return;
    const app = apps.find(a => a.id === dragId);
    if (!app || app.status === status) { setDragId(null); return; }
    try {
      const updates = { status };
      if (status === 'applied' && !app.applied_date) updates.applied_date = new Date().toISOString();
      await update(dragId, updates);
      await logActivity('status_change', 'application', dragId, `Moved "${app.job_title}" to ${status}`);
      addToast(`Moved to ${APP_STATUSES.find(s => s.key === status)?.label}`, 'success');
      refetch();
    } catch (e) { addToast(e.message, 'error'); }
    setDragId(null);
  };

  const handleDelete = async (id) => {
    try { await remove(id); addToast('Application removed', 'info'); setSelectedApp(null); refetch(); } catch (e) { addToast(e.message, 'error'); }
  };

  const handleAddManual = async (data) => {
    try {
      await insert(data);
      await logActivity('saved', 'application', null, `Added "${data.job_title}" at ${data.company}`);
      addToast('Application added!', 'success');
      setShowAdd(false);
      refetch();
    } catch (e) { addToast(e.message, 'error'); }
  };

  return (
    <div className="page-content">
      <header className="flex items-center justify-between mb-32">
        <div>
          <h1 className="page-title">Applications</h1>
          <p className="page-subtitle">{apps.length} tracked opportunities</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add New</button>
      </header>

      <div className="flex gap-12 mb-24 items-center">
        <select className="select" style={{ width: 200 }} value={filterCity} onChange={e => setFilterCity(e.target.value)}>
          <option value="">All Cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="select" style={{ width: 200 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Categories</option>
          {jobTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(filterCity || filterType) && <button className="btn btn-ghost btn-sm" onClick={() => { setFilterCity(''); setFilterType(''); }}>Reset</button>}
      </div>

      <div className="kanban-board">
        {APP_STATUSES.map(status => {
          const colApps = filtered.filter(a => a.status === status.key);
          return (
            <div key={status.key} className="kanban-column">
              <div className="kanban-column-header">
                <div className="kanban-column-title">
                  {status.label}
                  <span className="kanban-column-count">{colApps.length}</span>
                </div>
              </div>
              <div
                className={`kanban-column-body ${dragId ? 'drag-over' : ''}`}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(status.key)}
              >
                {colApps.map(app => (
                  <div
                    key={app.id}
                    className={`kanban-card ${dragId === app.id ? 'dragging' : ''}`}
                    draggable
                    onDragStart={() => setDragId(app.id)}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => setSelectedApp(app)}
                  >
                    <div className="kanban-card-title">{app.job_title}</div>
                    <div className="kanban-card-company">{app.company}</div>
                    <div className="kanban-card-meta">
                      {app.city && <span>📍 {app.city}</span>}
                      {formatSalary(app.salary_min, app.salary_max) && <span>💰 {formatSalary(app.salary_min, app.salary_max)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedApp && (
        <Modal isOpen={!!selectedApp} onClose={() => setSelectedApp(null)} title={selectedApp.job_title} large footer={
          <div className="flex justify-between w-full">
            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selectedApp.id)}>Delete Application</button>
            <div className="flex gap-12">
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedApp(null)}>Close</button>
              <select className="select" style={{ width: 160, height: 36, padding: '0 12px' }} value={selectedApp.status} onChange={async (e) => {
                await update(selectedApp.id, { status: e.target.value });
                refetch();
                setSelectedApp({ ...selectedApp, status: e.target.value });
                addToast('Status updated', 'success');
              }}>
                {APP_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>
        }>
          <div className="flex flex-col gap-24">
            <div className="flex items-center gap-12">
              <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--accent)' }}>{selectedApp.company}</span>
              <Badge status={selectedApp.status}>{APP_STATUSES.find(s => s.key === selectedApp.status)?.label}</Badge>
            </div>

            <div className="stats-grid" style={{ marginBottom: 0, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
              <div className="stat-card" style={{ padding: 16 }}>
                <div className="stat-card-label">Location</div>
                <div className="text-sm font-bold">{selectedApp.location || '—'}</div>
              </div>
              <div className="stat-card" style={{ padding: 16 }}>
                <div className="stat-card-label">Salary</div>
                <div className="text-sm font-bold">{formatSalary(selectedApp.salary_min, selectedApp.salary_max) || '—'}</div>
              </div>
              <div className="stat-card" style={{ padding: 16 }}>
                <div className="stat-card-label">Applied Date</div>
                <div className="text-sm font-bold">{selectedApp.applied_date ? formatDate(selectedApp.applied_date) : 'Not applied'}</div>
              </div>
            </div>

            {selectedApp.source_url && (
              <a href={selectedApp.source_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary w-full">
                🔗 View Job Posting
              </a>
            )}

            {selectedApp.notes && (
              <div className="form-group">
                <label className="form-label">Internal Notes</label>
                <div className="card" style={{ background: 'var(--bg-input)', border: 'none' }}>
                  <p className="text-sm text-secondary" style={{ whiteSpace: 'pre-wrap' }}>{selectedApp.notes}</p>
                </div>
              </div>
            )}

            {selectedApp.description && (
              <div className="form-group">
                <label className="form-label">Job Description</label>
                <div className="text-sm text-secondary" style={{ whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto', paddingRight: 8 }}>
                  {selectedApp.description}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      <AddApplicationModal isOpen={showAdd} onClose={() => setShowAdd(false)} onSave={handleAddManual} />
    </div>
  );
}

function AddApplicationModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({ job_title: '', company: '', location: '', city: '', job_type: '', salary_min: '', salary_max: '', source_url: '', notes: '' });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = () => {
    if (!form.job_title || !form.company) return;
    onSave({
      ...form,
      city: form.city || form.location?.split(',')[0]?.trim() || '',
      salary_min: form.salary_min ? parseInt(form.salary_min) : null,
      salary_max: form.salary_max ? parseInt(form.salary_max) : null,
      status: 'saved',
    });
    setForm({ job_title: '', company: '', location: '', city: '', job_type: '', salary_min: '', salary_max: '', source_url: '', notes: '' });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Application" footer={
      <><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit}>Create Application</button></>
    }>
      <div className="flex flex-col gap-20">
        <div className="grid-2">
          <div className="form-group"><label className="form-label">Job Title</label><input className="input" value={form.job_title} onChange={e => set('job_title', e.target.value)} placeholder="HVAC Technician" /></div>
          <div className="form-group"><label className="form-label">Company</label><input className="input" value={form.company} onChange={e => set('company', e.target.value)} placeholder="CoolAir Inc" /></div>
        </div>
        <div className="grid-2">
          <div className="form-group"><label className="form-label">Location</label><input className="input" value={form.location} onChange={e => set('location', e.target.value)} placeholder="Dallas, TX" /></div>
          <div className="form-group"><label className="form-label">Job Category</label><input className="input" value={form.job_type} onChange={e => set('job_type', e.target.value)} placeholder="Service" /></div>
        </div>
        <div className="grid-2">
          <div className="form-group"><label className="form-label">Min Salary</label><input className="input" type="number" value={form.salary_min} onChange={e => set('salary_min', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Max Salary</label><input className="input" type="number" value={form.salary_max} onChange={e => set('salary_max', e.target.value)} /></div>
        </div>
        <div className="form-group"><label className="form-label">Job URL</label><input className="input" value={form.source_url} onChange={e => set('source_url', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Notes</label><textarea className="textarea" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
      </div>
    </Modal>
  );
}

