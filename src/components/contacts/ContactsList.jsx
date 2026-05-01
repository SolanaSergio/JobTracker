import { useState } from 'react';
import { useSupabaseQuery, useSupabaseCrud, useActivityLog } from '../../hooks/useSupabase';
import { isSupabaseConfigured } from '../../lib/supabase';
import { CALL_OUTCOMES } from '../../utils/constants';
import { formatDate, formatDateTime, timeAgo } from '../../utils/helpers';
import { useToast, Modal, EmptyState, Spinner, ConfirmModal } from '../ui/UI';

export default function ContactsList({ onNavigate }) {
  const configured = isSupabaseConfigured();
  const { data: contacts, loading, refetch } = useSupabaseQuery('contacts');
  const { data: callLogs, refetch: refetchLogs } = useSupabaseQuery('call_logs', { orderBy: 'call_date', ascending: false });
  const { insert: insertContact, update: updateContact, remove: removeContact } = useSupabaseCrud('contacts');
  const { insert: insertCall } = useSupabaseCrud('call_logs');
  const logActivity = useActivityLog();
  const addToast = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showCallLog, setShowCallLog] = useState(false);
  const [callForm, setCallForm] = useState({ outcome: 'connected', duration_minutes: '', notes: '' });
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  if (!configured) return <div className="page-content"><EmptyState icon="👥" title="Configure Supabase" text="Go to Settings to set up your database." action={<button className="btn btn-primary" onClick={() => onNavigate('settings')}>Settings</button>} /></div>;
  if (loading) return <div className="page-content"><Spinner /></div>;

  const filtered = contacts.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase())
  );

  const getContactCalls = (id) => callLogs.filter(l => l.contact_id === id);

  const handleSaveContact = async (data) => {
    try {
      if (editContact) {
        await updateContact(editContact.id, data);
        addToast('Contact updated', 'success');
      } else {
        await insertContact(data);
        await logActivity('added', 'contact', null, `Added contact "${data.name}"`);
        addToast('Contact added!', 'success');
      }
      setShowAdd(false); setEditContact(null); refetch();
    } catch (e) { addToast(e.message, 'error'); }
  };

  const handleLogCall = async () => {
    if (!selectedContact) return;
    try {
      await insertCall({
        contact_id: selectedContact.id,
        outcome: callForm.outcome,
        duration_minutes: callForm.duration_minutes ? parseInt(callForm.duration_minutes) : null,
        notes: callForm.notes,
        call_date: new Date().toISOString(),
      });
      await logActivity('called', 'contact', selectedContact.id, `Called ${selectedContact.name} — ${callForm.outcome}`);
      addToast('Call logged!', 'success');
      setShowCallLog(false);
      setCallForm({ outcome: 'connected', duration_minutes: '', notes: '' });
      refetchLogs();
    } catch (e) { addToast(e.message, 'error'); }
  };

  const handleDelete = async () => {
    try { await removeContact(deleteId); addToast('Contact deleted', 'info'); setDeleteId(null); setSelectedContact(null); refetch(); } catch (e) { addToast(e.message, 'error'); }
  };

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-32">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-subtitle">{contacts.length} professional contacts in your network</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditContact(null); setShowAdd(true); }}>
          <span>+</span> Add Contact
        </button>
      </div>

      <div className="card mb-32">
        <div className="search-bar" style={{ maxWidth: 400 }}>
          <span style={{ opacity: 0.6 }}>🔍</span>
          <input 
            placeholder="Search by name, company, or title..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState 
          icon="👥" 
          title="No contacts found" 
          text="Start building your network by adding recruiters, hiring managers, and professional connections." 
          action={<button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Your First Contact</button>} 
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {filtered.map(c => {
            const calls = getContactCalls(c.id);
            return (
              <div key={c.id} className="card flex flex-col h-full" onClick={() => setSelectedContact(c)} style={{ cursor: 'pointer' }}>
                <div className="flex items-start gap-16 mb-20">
                  <div style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 12, 
                    background: 'var(--accent-soft)', 
                    color: 'var(--accent)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: 20,
                    fontWeight: 700
                  }}>
                    {c.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</h3>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{c.title || 'Professional Contact'}</div>
                  </div>
                  {calls.length > 0 && <span className="badge badge-applied">{calls.length} calls</span>}
                </div>

                <div className="flex flex-col gap-8 mb-20">
                  {c.company && (
                    <div className="flex items-center gap-8 text-sm text-secondary">
                      <span style={{ width: 16, textAlign: 'center' }}>🏢</span>
                      {c.company}
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-8 text-sm text-secondary">
                      <span style={{ width: 16, textAlign: 'center' }}>✉️</span>
                      {c.email}
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-8 text-sm text-secondary">
                      <span style={{ width: 16, textAlign: 'center' }}>📞</span>
                      {c.phone}
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-16 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-muted text-xs">Added {timeAgo(c.created_at)}</span>
                  <button className="btn btn-ghost btn-sm">View Details →</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Contact Detail Modal */}
      {selectedContact && !showCallLog && (
        <div className="modal-overlay" onClick={() => setSelectedContact(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-20">
                <div style={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: 16, 
                  background: 'var(--accent-soft)', 
                  color: 'var(--accent)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: 24,
                  fontWeight: 700
                }}>
                  {selectedContact.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 className="modal-title">{selectedContact.name}</h2>
                  <p className="text-secondary" style={{ fontSize: 14 }}>
                    {selectedContact.title} {selectedContact.company ? `at ${selectedContact.company}` : ''}
                  </p>
                </div>
              </div>
              <button className="btn btn-ghost" onClick={() => setSelectedContact(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="grid-2 gap-32 mb-32">
                <div className="flex flex-col gap-20">
                  <h4 className="section-title">Contact Information</h4>
                  <div className="flex flex-col gap-12">
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <p style={{ color: 'var(--text-primary)' }}>{selectedContact.phone || '—'}</p>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <p style={{ color: 'var(--text-primary)' }}>{selectedContact.email || '—'}</p>
                    </div>
                    {selectedContact.linkedin_url && (
                      <div className="form-group">
                        <label className="form-label">LinkedIn</label>
                        <p>
                          <a href={selectedContact.linkedin_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex' }}>
                            View LinkedIn Profile 🔗
                          </a>
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedContact.notes && (
                    <div className="mt-8">
                      <h4 className="section-title">Private Notes</h4>
                      <p className="text-secondary card" style={{ whiteSpace: 'pre-wrap', fontSize: 14, background: 'var(--bg-input)' }}>
                        {selectedContact.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-16">
                    <h4 className="section-title" style={{ marginBottom: 0 }}>Call History</h4>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowCallLog(true)}>📞 Log New Call</button>
                  </div>
                  
                  {getContactCalls(selectedContact.id).length === 0 ? (
                    <div className="empty-state" style={{ padding: '40px 20px' }}>
                      <p className="text-muted text-sm">No calls logged yet.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-12" style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 8 }}>
                      {getContactCalls(selectedContact.id).map(call => (
                        <div key={call.id} className="card" style={{ padding: 16, background: 'var(--bg-input)' }}>
                          <div className="flex items-center justify-between mb-8">
                            <span className={`badge ${call.outcome === 'connected' ? 'badge-offer' : 'badge-closed'}`}>
                              {call.outcome.replace(/_/g, ' ')}
                            </span>
                            <span className="text-muted text-xs">{formatDateTime(call.call_date)}</span>
                          </div>
                          {call.duration_minutes && (
                            <div className="text-xs text-secondary mb-8">⏱ Duration: {call.duration_minutes} minutes</div>
                          )}
                          {call.notes && (
                            <p className="text-sm text-secondary italic">"{call.notes}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={() => setDeleteId(selectedContact.id)}>Delete Contact</button>
              <div className="flex-1" />
              <button className="btn btn-secondary" onClick={() => { setEditContact(selectedContact); setShowAdd(true); }}>Edit Contact</button>
              <button className="btn btn-primary" onClick={() => setShowCallLog(true)}>Log Interaction</button>
            </div>
          </div>
        </div>
      )}

      {/* Log Call Modal */}
      <Modal isOpen={showCallLog} onClose={() => setShowCallLog(false)} title={`Log Call — ${selectedContact?.name}`} footer={
        <><button className="btn btn-secondary" onClick={() => setShowCallLog(false)}>Cancel</button><button className="btn btn-primary" onClick={handleLogCall}>Save Call</button></>
      }>
        <div className="flex flex-col gap-16">
          <div className="form-group"><label className="form-label">Outcome</label>
            <select className="select" value={callForm.outcome} onChange={e => setCallForm(p => ({ ...p, outcome: e.target.value }))}>
              {CALL_OUTCOMES.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Duration (minutes)</label><input className="input" type="number" value={callForm.duration_minutes} onChange={e => setCallForm(p => ({ ...p, duration_minutes: e.target.value }))} placeholder="e.g. 15" /></div>
          <div className="form-group"><label className="form-label">Notes</label><textarea className="textarea" value={callForm.notes} onChange={e => setCallForm(p => ({ ...p, notes: e.target.value }))} placeholder="What was discussed..." /></div>
        </div>
      </Modal>

      {/* Add/Edit Contact Modal */}
      <ContactFormModal isOpen={showAdd} onClose={() => { setShowAdd(false); setEditContact(null); }} onSave={handleSaveContact} initial={editContact} />

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Contact" message="This will also delete all associated call logs. Continue?" />
    </div>
  );
}

function ContactFormModal({ isOpen, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || { name: '', title: '', company: '', phone: '', email: '', linkedin_url: '', notes: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useState(() => { if (initial) setForm(initial); }, [initial]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'Edit Contact' : 'Add Contact'} footer={
      <><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => { if (form.name) { onSave(form); setForm({ name: '', title: '', company: '', phone: '', email: '', linkedin_url: '', notes: '' }); } }}>Save</button></>
    }>
      <div className="flex flex-col gap-16">
        <div className="form-row">
          <div className="form-group"><label className="form-label">Name *</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Title</label><input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Hiring Manager" /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Company</label><input className="input" value={form.company} onChange={e => set('company', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Email</label><input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">LinkedIn URL</label><input className="input" value={form.linkedin_url} onChange={e => set('linkedin_url', e.target.value)} /></div>
        </div>
        <div className="form-group"><label className="form-label">Notes</label><textarea className="textarea" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
      </div>
    </Modal>
  );
}
