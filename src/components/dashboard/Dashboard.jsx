import { useState, useEffect } from 'react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { isSupabaseConfigured } from '../../lib/supabase';
import { APP_STATUSES } from '../../utils/constants';
import { formatDate, timeAgo } from '../../utils/helpers';
import { Badge } from '../ui/UI';

export default function Dashboard({ onNavigate }) {
  const configured = isSupabaseConfigured();
  const { data: apps } = useSupabaseQuery('applications');
  const { data: contacts } = useSupabaseQuery('contacts');
  const { data: callLogs } = useSupabaseQuery('call_logs', { orderBy: 'call_date', ascending: false });
  const { data: activities } = useSupabaseQuery('activity_log', { orderBy: 'created_at', ascending: false });

  if (!configured) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="bento-card" style={{ maxWidth: 400, textAlign: 'center' }}>
          <h2 className="page-title mb-8">Ready to start?</h2>
          <p className="page-subtitle mb-24">Configure your workspace to begin tracking your career journey.</p>
          <button className="btn btn-primary w-full" onClick={() => onNavigate('settings')}>Open Settings</button>
        </div>
      </div>
    );
  }

  const statusCounts = {};
  APP_STATUSES.forEach(s => { statusCounts[s.key] = 0; });
  apps.forEach(a => { if (statusCounts[a.status] !== undefined) statusCounts[a.status]++; });

  const activeApps = apps.filter(a => !['closed', 'saved'].includes(a.status)).length;
  const totalApps = apps.length;
  const interviews = (statusCounts['interview'] || 0) + (statusCounts['phone_screen'] || 0);
  const offers = statusCounts['offer'] || 0;
  
  const appToInterview = totalApps > 0 ? Math.round((interviews / totalApps) * 100) : 0;
  const interviewToOffer = interviews > 0 ? Math.round((offers / interviews) * 100) : 0;

  const upcomingInterviews = apps
    .filter(a => ['phone_screen', 'interview'].includes(a.status))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4);

  const followUpContacts = contacts.slice(0, 3);

  // Weekly data for sparkline (last 7 days)
  const sparklineData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return apps.filter(a => new Date(a.created_at).toDateString() === d.toDateString()).length;
  });

  return (
    <div className="page-content">
      <header className="flex justify-between items-end mb-32">
        <div>
          <h1 className="page-title">Executive Overview</h1>
          <p className="page-subtitle">Precision tracking for your career progression</p>
        </div>
        <div className="flex gap-12">
          <button className="btn btn-ghost">Export Data</button>
          <button className="btn btn-primary" onClick={() => onNavigate('search')}>New Search</button>
        </div>
      </header>

      <div className="bento-grid">
        {/* Main Stats */}
        <div className="bento-card col-2">
          <div className="card-title">Total Pipeline</div>
          <div className="card-value">{totalApps}</div>
          <div className="card-trend trend-up">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
            Active applications
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 12 }}>
            <Sparkline data={sparklineData} color="var(--accent)" />
          </div>
        </div>

        <div className="bento-card col-2">
          <div className="card-title">Conversion Rate</div>
          <div className="card-value">{appToInterview}%</div>
          <p className="text-xs text-muted mt-8">Application to Interview</p>
          <div style={{ marginTop: 'auto', paddingTop: 12 }}>
            <ProgressBar percentage={appToInterview} color="var(--accent)" />
          </div>
        </div>

        <div className="bento-card col-2">
          <div className="card-title">Offer Pass Rate</div>
          <div className="card-value">{interviewToOffer}%</div>
          <p className="text-xs text-muted mt-8">Interview to Offer</p>
          <div style={{ marginTop: 'auto', paddingTop: 12 }}>
            <ProgressBar percentage={interviewToOffer} color="var(--accent-2, #3b82f6)" />
          </div>
        </div>

        {/* Upcoming Section */}
        <div className="bento-card col-4 row-2">
          <div className="card-title justify-between">
            Upcoming Interviews
            <Badge className="badge-emerald">Priority</Badge>
          </div>
          {upcomingInterviews.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-40">
              <p className="text-sm">No interviews scheduled</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 mt-8">
              {upcomingInterviews.map(app => (
                <div key={app.id} className="flex items-center justify-between p-12 hover:bg-white/[0.02] rounded-lg transition-colors cursor-pointer" onClick={() => onNavigate('applications')}>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{app.job_title}</span>
                    <span className="text-xs text-secondary">{app.company}</span>
                  </div>
                  <div className="flex items-center gap-12">
                    <span className="text-[11px] text-muted">{timeAgo(app.created_at)}</span>
                    <Badge status={app.status}>{app.status === 'phone_screen' ? 'Phone' : 'Interview'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 'auto' }}>
            <button className="btn btn-ghost w-full text-xs" onClick={() => onNavigate('applications')}>View All Applications</button>
          </div>
        </div>

        {/* Funnel Section */}
        <div className="bento-card col-2 row-2">
          <div className="card-title">Pipeline Funnel</div>
          <div className="flex flex-col gap-20 mt-12">
            <FunnelStage label="Apps" value={totalApps} max={totalApps} />
            <FunnelStage label="Interviews" value={interviews} max={totalApps} />
            <FunnelStage label="Offers" value={offers} max={totalApps} color="var(--accent)" />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bento-card col-4">
          <div className="card-title">Recent Activity</div>
          <div className="flex flex-col mt-4">
            {activities.slice(0, 3).map(a => (
              <div key={a.id} className="activity-item">
                <div className="activity-dot" />
                <div className="activity-content">
                  <div className="flex justify-between items-center mb-2">
                    <span className="activity-text">{a.description}</span>
                    <span className="activity-time">{timeAgo(a.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Networking */}
        <div className="bento-card col-2">
          <div className="card-title">Network</div>
          <div className="card-value">{contacts.length}</div>
          <p className="text-[11px] text-muted mt-4">Active connections</p>
          <div style={{ marginTop: 'auto' }}>
            <button className="btn btn-ghost btn-sm w-full" onClick={() => onNavigate('contacts')}>Manage Network</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sparkline({ data, color }) {
  const max = Math.max(...data, 1);
  const points = data.map((d, i) => `${(i / 6) * 100},${100 - (d / max) * 100}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" style={{ height: 40, width: '100%', overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        style={{ filter: 'drop-shadow(0 0 4px ' + color + '44)' }}
      />
    </svg>
  );
}

function ProgressBar({ percentage, color }) {
  return (
    <div style={{ height: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${percentage}%`, background: color, borderRadius: 2, transition: 'width 1s ease' }} />
    </div>
  );
}

function FunnelStage({ label, value, max, color = 'var(--text-secondary)' }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="funnel-stage">
      <div className="flex justify-between items-center text-[11px] font-semibold uppercase tracking-wider">
        <span style={{ color }}>{label}</span>
        <span className="text-primary">{value}</span>
      </div>
      <div className="funnel-bar-bg">
        <div className="funnel-bar-fill" style={{ width: `${percentage}%`, background: color }} />
      </div>
    </div>
  );
}



