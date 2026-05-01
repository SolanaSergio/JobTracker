import { useState } from 'react';
import { searchJobs, isJSearchConfigured } from '../../lib/jsearch';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useSupabaseCrud, useActivityLog } from '../../hooks/useSupabase';
import { useToast } from '../ui/UI';
import { DATE_FILTERS, WORK_MODES } from '../../utils/constants';
import { formatSalary, truncate, timeAgo, extractCity } from '../../utils/helpers';
import { EmptyState, Spinner, Modal, Badge } from '../ui/UI';

export default function JobSearch({ onNavigate }) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [datePosted, setDatePosted] = useState('all');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const addToast = useToast();
  const { insert: insertApp } = useSupabaseCrud('applications');
  const logActivity = useActivityLog();

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    if (!isJSearchConfigured()) {
      setError('RapidAPI key not configured. Go to Settings to add it.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await searchJobs({ query, location, datePosted, remoteOnly });
      setResults(res.jobs);
      if (res.jobs.length === 0) setError('No jobs found. Try different keywords or location.');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveJob = async (job) => {
    if (!isSupabaseConfigured()) {
      addToast('Configure Supabase in Settings first', 'error');
      return;
    }
    try {
      await insertApp({
        job_title: job.title,
        company: job.company,
        location: job.location,
        city: job.city || extractCity(job.location),
        state: job.state,
        salary_min: job.salaryMin,
        salary_max: job.salaryMax,
        employment_type: job.employmentType,
        work_mode: job.isRemote ? 'remote' : 'on-site',
        status: 'saved',
        source_url: job.applyLink || job.sourceUrl,
        source_site: job.sourceSite,
        description: job.description,
      });
      await logActivity('saved', 'application', null, `Saved "${job.title}" at ${job.company}`);
      addToast(`Saved "${job.title}" to your board!`, 'success');
    } catch (e) {
      addToast('Failed to save: ' + e.message, 'error');
    }
  };

  return (
    <div className="page-content">
      <h1 className="page-title">Job Search</h1>
      <p className="page-subtitle">Search across LinkedIn, Indeed, Glassdoor, ZipRecruiter & more</p>

      <div className="card mb-24">
        <form onSubmit={handleSearch}>
          <div className="flex gap-12" style={{ flexWrap: 'wrap' }}>
            <div className="search-bar" style={{ flex: 2, minWidth: 250 }}>
              <span style={{ opacity: 0.6 }}>🔍</span>
              <input 
                placeholder="Job title, keywords, or company (e.g. HVAC Technician)" 
                value={query} 
                onChange={e => setQuery(e.target.value)} 
              />
            </div>
            <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
              <span style={{ opacity: 0.6 }}>📍</span>
              <input 
                placeholder="City, state, or 'remote'" 
                value={location} 
                onChange={e => setLocation(e.target.value)} 
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Spinner /> : 'Search Jobs'}
            </button>
          </div>
        </form>

        <div className="flex items-center gap-12 mt-16" style={{ flexWrap: 'wrap' }}>
          <span className="text-muted text-xs font-semibold uppercase tracking-wider">Filters:</span>
          {DATE_FILTERS.map(f => (
            <button 
              key={f.key} 
              className={`btn btn-sm ${datePosted === f.key ? 'btn-primary' : 'btn-ghost'}`} 
              onClick={() => setDatePosted(f.key)}
            >
              {f.label}
            </button>
          ))}
          <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />
          <button 
            className={`btn btn-sm ${remoteOnly ? 'btn-primary' : 'btn-ghost'}`} 
            onClick={() => setRemoteOnly(!remoteOnly)}
          >
            🏠 Remote Only
          </button>
        </div>
      </div>

      {error && (
        <div className="card mb-24" style={{ borderColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <div className="flex items-center gap-12">
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div className="flex-1">
              <p style={{ color: 'var(--danger)', fontSize: 14, fontWeight: 500 }}>{error}</p>
              {error.includes('Settings') && (
                <button className="btn btn-sm btn-secondary mt-8" onClick={() => onNavigate('settings')}>
                  Open Settings
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center p-40">
          <Spinner />
        </div>
      )}

      {!loading && results.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
          {results.map(job => (
            <div key={job.id} className="card flex flex-col h-full" onClick={() => setSelectedJob(job)} style={{ cursor: 'pointer' }}>
              <div className="flex gap-16 mb-16">
                <div className="flex-1">
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>{job.title}</h3>
                  <div style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 500 }}>{job.company}</div>
                </div>
                {job.companyLogo ? (
                  <img src={job.companyLogo} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'contain', background: 'white', padding: 4 }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    🏢
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-8 mb-16">
                <span className="badge">📍 {job.location}</span>
                {job.isRemote && <span className="badge badge-offer">Remote</span>}
                {job.employmentType && <span className="badge badge-applied">{job.employmentType}</span>}
                {formatSalary(job.salaryMin, job.salaryMax) && (
                  <span className="badge badge-interview">💰 {formatSalary(job.salaryMin, job.salaryMax)}</span>
                )}
              </div>

              <div className="flex-1 text-secondary text-sm mb-20 line-clamp-3" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {job.description}
              </div>

              <div className="flex items-center justify-between mt-auto pt-16" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="text-muted text-xs">🕒 {timeAgo(job.postedDate)} via {job.sourceSite}</span>
                <div className="flex gap-8" onClick={e => e.stopPropagation()}>
                  <button className="btn btn-ghost btn-sm" onClick={() => saveJob(job)}>🔖 Save</button>
                  {job.applyLink && (
                    <a href={job.applyLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                      Apply
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && !error && (
        <EmptyState 
          icon="🔍" 
          title="Find your next role" 
          text="Search across 100+ job boards to find the perfect position. Enter a title and location to get started." 
        />
      )}

      {selectedJob && (
        <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex gap-16">
                {selectedJob.companyLogo ? (
                  <img src={selectedJob.companyLogo} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'contain', background: 'white', padding: 4 }} />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                    🏢
                  </div>
                )}
                <div>
                  <h2 className="modal-title" style={{ fontSize: 20 }}>{selectedJob.title}</h2>
                  <p style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 500 }}>{selectedJob.company} • {selectedJob.location}</p>
                </div>
              </div>
              <button className="btn btn-ghost" onClick={() => setSelectedJob(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="flex gap-8 mb-24" style={{ flexWrap: 'wrap' }}>
                {formatSalary(selectedJob.salaryMin, selectedJob.salaryMax) && <span className="badge badge-offer" style={{ padding: '4px 12px' }}>💰 {formatSalary(selectedJob.salaryMin, selectedJob.salaryMax)}</span>}
                {selectedJob.employmentType && <span className="badge badge-applied" style={{ padding: '4px 12px' }}>{selectedJob.employmentType}</span>}
                {selectedJob.isRemote && <span className="badge badge-offer" style={{ padding: '4px 12px' }}>Remote</span>}
                <span className="badge" style={{ padding: '4px 12px' }}>🕒 Posted {timeAgo(selectedJob.postedDate)}</span>
              </div>

              <div className="grid-2 gap-32">
                <div className="flex flex-col gap-24">
                  {selectedJob.qualifications?.length > 0 && (
                    <div>
                      <h4 className="section-title">Qualifications</h4>
                      <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8 }}>
                        {selectedJob.qualifications.map((q, i) => <li key={i}>{q}</li>)}
                      </ul>
                    </div>
                  )}
                  {selectedJob.responsibilities?.length > 0 && (
                    <div>
                      <h4 className="section-title">Responsibilities</h4>
                      <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8 }}>
                        {selectedJob.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="section-title">About the Role</h4>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {selectedJob.description}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedJob(null)}>Close</button>
              <button className="btn btn-ghost" onClick={() => { saveJob(selectedJob); setSelectedJob(null); }}>🔖 Save to Board</button>
              {selectedJob.applyLink && (
                <a href={selectedJob.applyLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  Apply Now 🔗
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
