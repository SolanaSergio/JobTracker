import { useState, useRef } from 'react';
import { useSupabaseQuery, useSupabaseCrud, useActivityLog } from '../../hooks/useSupabase';
import { isSupabaseConfigured, getSupabase } from '../../lib/supabase';
import { SUBMISSION_METHODS, SUBMISSION_STATUSES } from '../../utils/constants';
import { formatDate, timeAgo } from '../../utils/helpers';
import { useToast, Modal, EmptyState, Spinner } from '../ui/UI';

export default function ResumeManager({ onNavigate }) {
  const configured = isSupabaseConfigured();
  const { data: resumes, loading, refetch } = useSupabaseQuery('resumes');
  const { data: submissions, refetch: refetchSubs } = useSupabaseQuery('resume_submissions', { orderBy: 'submitted_date', ascending: false });
  const { data: apps } = useSupabaseQuery('applications');
  const { insert: insertResume, remove: removeResume } = useSupabaseCrud('resumes');
  const { insert: insertSub } = useSupabaseCrud('resume_submissions');
  const logActivity = useActivityLog();
  const addToast = useToast();
  const fileRef = useRef();
  const [showUpload, setShowUpload] = useState(false);
  const [showTrack, setShowTrack] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);
  const [uploadForm, setUploadForm] = useState({ label: '', target_industry: '', notes: '' });
  const [trackForm, setTrackForm] = useState({ resume_id: '', company: '', method: 'online_portal', notes: '' });
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState('resumes');

  if (!configured) return <div className="page-content"><EmptyState icon="📄" title="Configure Supabase" text="Go to Settings to set up your database." action={<button className="btn btn-primary" onClick={() => onNavigate('settings')}>Settings</button>} /></div>;
  if (loading) return <div className="page-content"><Spinner /></div>;

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !uploadForm.label) { addToast('Select a file and enter a label', 'error'); return; }
    setUploading(true);
    try {
      const sb = getSupabase();
      const path = `${Date.now()}_${file.name}`;
      const { error: upErr } = await sb.storage.from('resumes').upload(path, file);
      if (upErr) throw upErr;
      await insertResume({ label: uploadForm.label, file_name: file.name, file_path: path, file_size: file.size, target_industry: uploadForm.target_industry, notes: uploadForm.notes });
      await logActivity('uploaded', 'resume', null, `Uploaded resume "${uploadForm.label}"`);
      addToast('Resume uploaded!', 'success');
      setShowUpload(false);
      setUploadForm({ label: '', target_industry: '', notes: '' });
      refetch();
    } catch (e) { addToast('Upload failed: ' + e.message, 'error'); }
    setUploading(false);
  };

  const handleDownload = async (resume) => {
    try {
      const sb = getSupabase();
      const { data, error } = await sb.storage.from('resumes').download(resume.file_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a'); a.href = url; a.download = resume.file_name; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { addToast('Download failed: ' + e.message, 'error'); }
  };

  const handleDelete = async (id) => {
    try { await removeResume(id); addToast('Resume deleted', 'info'); refetch(); } catch (e) { addToast(e.message, 'error'); }
  };

  const handleTrackSubmission = async () => {
    if (!trackForm.resume_id || !trackForm.company) return;
    try {
      await insertSub({ ...trackForm, submitted_date: new Date().toISOString(), status: 'sent' });
      const resume = resumes.find(r => r.id === trackForm.resume_id);
      await logActivity('submitted', 'resume', trackForm.resume_id, `Sent "${resume?.label}" to ${trackForm.company}`);
      addToast('Submission tracked!', 'success');
      setShowTrack(false);
      setTrackForm({ resume_id: '', company: '', method: 'online_portal', notes: '' });
      refetchSubs();
    } catch (e) { addToast(e.message, 'error'); }
  };

  const getResumeSubmissions = (id) => submissions.filter(s => s.resume_id === id);

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-32">
        <div>
          <h1 className="page-title">Resumes</h1>
          <p className="page-subtitle">Manage multiple versions of your resume and track where you send them</p>
        </div>
        <div className="flex gap-12">
          <button className="btn btn-secondary" onClick={() => setShowTrack(true)}>📤 Track Submission</button>
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
            <span>+</span> Upload New
          </button>
        </div>
      </div>

      <div className="flex items-center gap-24 mb-32" style={{ borderBottom: '1px solid var(--border)' }}>
        <button 
          className={`btn btn-ghost`} 
          style={{ 
            borderRadius: 0, 
            padding: '12px 16px', 
            borderBottom: tab === 'resumes' ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab === 'resumes' ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: tab === 'resumes' ? 700 : 500
          }} 
          onClick={() => setTab('resumes')}
        >
          My Versions
        </button>
        <button 
          className={`btn btn-ghost`} 
          style={{ 
            borderRadius: 0, 
            padding: '12px 16px', 
            borderBottom: tab === 'submissions' ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab === 'submissions' ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: tab === 'submissions' ? 700 : 500
          }} 
          onClick={() => setTab('submissions')}
        >
          Submission History ({submissions.length})
        </button>
      </div>

      {tab === 'resumes' && (
        resumes.length === 0 ? (
          <EmptyState 
            icon="📄" 
            title="No resumes uploaded" 
            text="Keep track of different versions of your resume (e.g., industry-specific or chronological vs functional)." 
            action={<button className="btn btn-primary" onClick={() => setShowUpload(true)}>+ Upload Your First Resume</button>} 
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
            {resumes.map(r => {
              const subs = getResumeSubmissions(r.id);
              return (
                <div key={r.id} className="card">
                  <div className="flex items-start gap-20 mb-20">
                    <div style={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: 12, 
                      background: 'rgba(59, 130, 246, 0.1)', 
                      color: '#3b82f6', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: 24 
                    }}>
                      📄
                    </div>
                    <div className="flex-1">
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{r.label}</h3>
                      <p className="text-muted text-xs mt-4">
                        {r.file_name} • {(r.file_size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(r.id)}>🗑</button>
                  </div>
                  
                  {r.target_industry && (
                    <div className="mb-16">
                      <span className="badge badge-applied">🎯 {r.target_industry}</span>
                    </div>
                  )}

                  {r.notes && (
                    <p className="text-sm text-secondary italic mb-20">"{r.notes}"</p>
                  )}

                  <div className="mt-auto pt-16 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
                    <span className="text-muted text-xs">Sent to {subs.length} companies</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleDownload(r)}>⬇ Download PDF</button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === 'submissions' && (
        submissions.length === 0 ? (
          <EmptyState 
            icon="📤" 
            title="No submissions tracked yet" 
            text="Track exactly which resume version you sent to each company." 
            action={<button className="btn btn-primary" onClick={() => setShowTrack(true)}>Track a Submission</button>}
          />
        ) : (
          <div className="card">
            <div className="flex flex-col gap-4">
              {submissions.map((s, idx) => {
                const resume = resumes.find(r => r.id === s.resume_id);
                return (
                  <div key={s.id} className="flex items-center gap-16 py-16" style={{ borderBottom: idx === submissions.length - 1 ? 'none' : '1px solid var(--border)' }}>
                    <div className="text-muted text-sm" style={{ width: 120 }}>{formatDate(s.submitted_date)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-8">
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.company}</span>
                        <span className="badge badge-applied" style={{ fontSize: 10 }}>{s.method.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="text-secondary text-xs mt-4">Version: <span style={{ color: 'var(--accent)' }}>{resume?.label || 'Deleted Version'}</span></div>
                    </div>
                    {s.notes && <div className="text-muted text-sm italic" style={{ maxWidth: 300 }}>"{s.notes}"</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Upload Modal */}
      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="Upload Resume" footer={
        <><button className="btn btn-secondary" onClick={() => setShowUpload(false)}>Cancel</button><button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>{uploading ? '⏳ Uploading...' : 'Upload'}</button></>
      }>
        <div className="flex flex-col gap-16">
          <div className="form-group"><label className="form-label">Resume File (PDF)</label><input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="input" /></div>
          <div className="form-group"><label className="form-label">Label *</label><input className="input" value={uploadForm.label} onChange={e => setUploadForm(p => ({ ...p, label: e.target.value }))} placeholder="e.g. HVAC Technician v2" /></div>
          <div className="form-group"><label className="form-label">Target Industry</label><input className="input" value={uploadForm.target_industry} onChange={e => setUploadForm(p => ({ ...p, target_industry: e.target.value }))} placeholder="e.g. HVAC" /></div>
          <div className="form-group"><label className="form-label">Notes</label><textarea className="textarea" value={uploadForm.notes} onChange={e => setUploadForm(p => ({ ...p, notes: e.target.value }))} /></div>
        </div>
      </Modal>

      {/* Track Submission Modal */}
      <Modal isOpen={showTrack} onClose={() => setShowTrack(false)} title="Track Submission" footer={
        <><button className="btn btn-secondary" onClick={() => setShowTrack(false)}>Cancel</button><button className="btn btn-primary" onClick={handleTrackSubmission}>Save</button></>
      }>
        <div className="flex flex-col gap-16">
          <div className="form-group"><label className="form-label">Resume *</label>
            <select className="select" value={trackForm.resume_id} onChange={e => setTrackForm(p => ({ ...p, resume_id: e.target.value }))}>
              <option value="">Select resume...</option>
              {resumes.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Company *</label><input className="input" value={trackForm.company} onChange={e => setTrackForm(p => ({ ...p, company: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Method</label>
            <select className="select" value={trackForm.method} onChange={e => setTrackForm(p => ({ ...p, method: e.target.value }))}>
              {SUBMISSION_METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Notes</label><textarea className="textarea" value={trackForm.notes} onChange={e => setTrackForm(p => ({ ...p, notes: e.target.value }))} /></div>
        </div>
      </Modal>
    </div>
  );
}
