import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workApi, peopleApi, vceApi, formatINR, formatDate, rupeesToPaise } from '../api/client';
import { WorkItem, Citizen, ServiceItem } from '../types';
import { useToast } from '../context/ToastContext';

export const ApplicationsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedWork, setSelectedWork] = useState<WorkItem | null>(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // New Application Form State
  const [personId, setPersonId] = useState<number | ''>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<string>('Cash');
  const [notes, setNotes] = useState<string>('');
  const [ackNo, setAckNo] = useState<string>('');

  // Edit Application Form State
  const [editStatus, setEditStatus] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editReceivedPaise, setEditReceivedPaise] = useState<number>(0);

  const toast = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: workItems = [], isLoading } = useQuery({
    queryKey: ['work', search, statusFilter, categoryFilter],
    queryFn: () => workApi.getAll({ query: search || undefined, status: statusFilter || undefined, category: categoryFilter || undefined }),
  });

  const { data: citizens = [] } = useQuery({
    queryKey: ['citizens'],
    queryFn: () => peopleApi.getAll(),
  });

  const { data: serviceCatalog = [] } = useQuery({
    queryKey: ['services-catalog'],
    queryFn: () => vceApi.getServicesCatalog(),
  });

  const categories = Array.from(new Set(serviceCatalog.map((s) => s.category))).filter(Boolean);
  const currentService = serviceCatalog.find((s) => s.id === selectedServiceId);

  // Create Mutation
  const createWorkMutation = useMutation({
    mutationFn: async () => {
      if (!personId || !currentService) throw new Error('Please select both a citizen and a service.');
      return workApi.create({
        person_id: Number(personId),
        title: currentService.title,
        category: currentService.category,
        agreed_amount: currentService.citizen_fee,
        received_amount: paymentMode === 'Udhar' ? 0 : currentService.citizen_fee,
        pending_amount: paymentMode === 'Udhar' ? currentService.citizen_fee : 0,
        status: 'New',
        portal_name: currentService.portal,
        portal_cost: currentService.portal_deduction,
        panchayat_share: currentService.panchayat_share,
        vce_commission: currentService.vce_commission,
        payment_mode: paymentMode,
        ack_no: ackNo,
        notes,
      });
    },
    onSuccess: () => {
      toast.success('Application token created successfully!');
      queryClient.invalidateQueries({ queryKey: ['work'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['rojmel'] });
      setIsAddModalOpen(false);
      setPersonId('');
      setSelectedServiceId('');
      setNotes('');
      setAckNo('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create application');
    },
  });

  // Update Mutation
  const updateWorkMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWork) throw new Error('No application selected');
      return workApi.update(selectedWork.id, {
        status: editStatus,
        notes: editNotes,
        received_amount: editReceivedPaise,
        pending_amount: Math.max(0, (selectedWork.agreed_amount || 0) - editReceivedPaise),
      });
    },
    onSuccess: () => {
      toast.success('Application updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['work'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsEditModalOpen(false);
      setIsTimelineOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update application');
    },
  });

  // Delete Mutation
  const deleteWorkMutation = useMutation({
    mutationFn: async (id: number) => {
      return workApi.delete(id);
    },
    onSuccess: () => {
      toast.success('Application deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['work'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsTimelineOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete application');
    },
  });

  const getStatusClass = (status: string) => {
    if (!status) return 'badge-waiting';
    if (status === 'Ready / Printed') return 'badge-planned';
    if (status === 'Completed / Delivered' || status === 'Completed') return 'badge-completed';
    if (status === 'In Progress') return 'badge-in-progress';
    if (status.includes('Cancelled') || status.includes('Rejected')) return 'badge-cancelled';
    return 'badge-waiting';
  };

  const openTimeline = (item: WorkItem) => {
    setSelectedWork(item);
    setIsTimelineOpen(true);
  };

  const openEdit = (item: WorkItem) => {
    setSelectedWork(item);
    setEditStatus(item.status);
    setEditNotes(item.notes || '');
    setEditReceivedPaise(item.received_amount || 0);
    setIsEditModalOpen(true);
  };

  const printReceipt = (item: WorkItem) => {
    window.print();
  };

  return (
    <>
      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '1.65rem' }}>
        <div
          className="card-body filter-bar-shell"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.15rem',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.65rem',
          }}
        >
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <input
              type="text"
              id="work-search-input"
              className="form-control"
              placeholder="Search citizen, token (TK-...), village, or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.6rem' }}
            />
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="2"
              style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', width: '100%', maxWidth: '480px' }}>
            <select
              id="work-status-filter"
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ flex: 1, minWidth: '140px', padding: '0.55rem 0.95rem', fontSize: '0.85rem', fontWeight: 600 }}
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Ready / Printed">Ready / Printed</option>
              <option value="Completed / Delivered">Completed / Delivered</option>
              <option value="Cancelled / Rejected">Cancelled / Rejected</option>
            </select>
            <select
              id="work-category-filter"
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ flex: 1, minWidth: '140px', padding: '0.55rem 0.95rem', fontSize: '0.85rem', fontWeight: 600 }}
            >
              <option value="">All Services</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Work Table & Mobile Card Feed */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 className="card-title">Applications Ledger</h2>
            <span id="work-count-badge" className="badge badge-waiting font-tabular">
              {workItems.length} Applications
            </span>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setIsAddModalOpen(true)}
            type="button"
            style={{ fontWeight: 700 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>New Application</span>
          </button>
        </div>

        <div className="table-container hide-on-mobile">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '140px', minWidth: '140px' }}>Token No.</th>
                <th style={{ minWidth: '170px' }}>Citizen &amp; Village</th>
                <th style={{ minWidth: '220px' }}>Service &amp; Portal</th>
                <th style={{ width: '125px', minWidth: '125px' }}>Status</th>
                <th style={{ width: '105px', minWidth: '105px', whiteSpace: 'nowrap' }}>Date</th>
                <th style={{ width: '95px', minWidth: '95px', textAlign: 'right', whiteSpace: 'nowrap' }}>Total Fee</th>
                <th style={{ width: '95px', minWidth: '95px', textAlign: 'right', whiteSpace: 'nowrap' }}>Received</th>
                <th style={{ width: '115px', minWidth: '115px', textAlign: 'right', whiteSpace: 'nowrap' }}>Pending (Udhar)</th>
                <th style={{ width: '185px', minWidth: '185px', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody id="work-table-body">
              {isLoading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Loading applications...
                  </td>
                </tr>
              ) : workItems.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                    No applications found. Click "+ New Application" above to add one.
                  </td>
                </tr>
              ) : (
                workItems.map((w) => {
                  const token = w.token_no || w.token_number || `TK-${w.id}`;
                  const pending = Math.max(0, (w.agreed_amount || 0) - (w.received_amount || 0));
                  const statusClass = getStatusClass(w.status);

                  return (
                    <tr key={w.id} data-work-id={w.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className="token-pill">{token}</span>
                        {w.ack_no && <div className="token-sub">Ack: {w.ack_no}</div>}
                      </td>
                      <td>
                        <div className="citizen-cell">
                          <div className="citizen-name">{w.person_name || 'Citizen'}</div>
                          <div className="citizen-meta">
                            {w.person_village && (
                              <span className="citizen-meta-item">
                                <span>📍</span>
                                {w.person_village}
                              </span>
                            )}
                            {w.person_phone && (
                              <span className="citizen-meta-item">
                                <span>📞</span>
                                {w.person_phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="service-cell">
                          <div className="service-title">{w.title}</div>
                          <div className="service-meta">
                            <span>{w.service_category || w.category || ''}</span>
                            {w.portal_name && <span className="portal-tag">{w.portal_name}</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className={`badge ${statusClass}`}>{w.status}</span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {formatDate(w.start_date || w.created_at)}
                      </td>
                      <td className="font-tabular" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                        {formatINR(w.agreed_amount)}
                      </td>
                      <td
                        className="font-tabular"
                        style={{
                          textAlign: 'right',
                          fontWeight: 600,
                          color: (w.received_amount || 0) > 0 ? '#10b981' : 'var(--text-dim)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatINR(w.received_amount)}
                      </td>
                      <td
                        className="font-tabular"
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: pending > 0 ? '#ef4444' : '#10b981',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatINR(pending)}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div className="table-actions">
                          <button
                            className="btn-table-action btn-table-receipt btn-quick-receipt"
                            onClick={() => printReceipt(w)}
                            title="View / Print Receipt"
                            type="button"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                            <span>Receipt</span>
                          </button>
                          <button
                            className="btn-table-action btn-view-timeline"
                            onClick={() => openTimeline(w)}
                            title="Details & Timeline"
                            type="button"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="16" x2="12" y2="12" />
                              <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                            <span>Details</span>
                          </button>
                          <button
                            className="btn-table-action btn-table-icon btn-edit-work"
                            onClick={() => openEdit(w)}
                            title="Edit Application"
                            aria-label="Edit Application"
                            type="button"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            className="btn-table-action btn-table-icon btn-table-delete btn-delete-work"
                            onClick={() => {
                              if (window.confirm(`Delete application token ${token}?`)) {
                                deleteWorkMutation.mutate(w.id);
                              }
                            }}
                            title="Delete Application"
                            aria-label="Delete Application"
                            type="button"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Adaptive Feed Cards */}
        <div className="mobile-card-list show-on-mobile-only" id="mobile-work-list" style={{ padding: '0.75rem' }}>
          {workItems.map((w) => {
            const token = w.token_no || w.token_number || `TK-${w.id}`;
            const fee = w.agreed_amount || 0;
            const received = w.received_amount || 0;
            const pending = Math.max(0, fee - received);
            const statusClass = getStatusClass(w.status);

            return (
              <div className="mobile-card" key={w.id} onClick={() => openTimeline(w)}>
                <div className="mobile-card-header">
                  <div className="mobile-card-title-group">
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-light)', fontSize: '0.825rem' }}>
                      {token}
                    </span>
                    <div className="mobile-card-title">{w.person_name || 'Walk-in Citizen'}</div>
                  </div>
                  <span className={`badge ${statusClass}`}>{w.status}</span>
                </div>
                <div className="mobile-card-body">
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>{w.title}</div>
                  <div className="mobile-card-subtitle">
                    <span>{w.service_category || w.category || 'General'}</span>
                    {w.portal_name && (
                      <>
                        <span>&bull;</span>
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>{w.portal_name}</span>
                      </>
                    )}
                  </div>
                  <div className="mobile-card-metric-row">
                    <div>
                      <div className="mobile-card-metric-label">Total Fee</div>
                      <div className="mobile-card-metric-val">{formatINR(fee)}</div>
                    </div>
                    <div>
                      <div className="mobile-card-metric-label">Received</div>
                      <div className="mobile-card-metric-val" style={{ color: 'var(--revenue)' }}>
                        {formatINR(received)}
                      </div>
                    </div>
                    <div>
                      <div className="mobile-card-metric-label">Pending</div>
                      <div className="mobile-card-metric-val" style={{ color: pending > 0 ? 'var(--expense)' : 'var(--revenue)' }}>
                        {formatINR(pending)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Application Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop open" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-dialog" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">New Service Application (નવી અરજી)</h3>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)} aria-label="Close" type="button">
                &times;
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createWorkMutation.mutate();
              }}
            >
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Citizen / Beneficiary (નાગરિક) *</label>
                  <select
                    className="form-select"
                    value={personId}
                    onChange={(e) => setPersonId(e.target.value ? Number(e.target.value) : '')}
                    required
                  >
                    <option value="">Select registered citizen...</option>
                    {citizens.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.village ? `(${c.village})` : ''} — {c.phone || 'No Phone'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Service (સેવા પસંદ કરો) *</label>
                  <select
                    className="form-select"
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    required
                  >
                    <option value="">Select official service catalog item...</option>
                    {serviceCatalog.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} — Fee: {formatINR(s.citizen_fee)} ({s.portal})
                      </option>
                    ))}
                  </select>
                </div>

                {currentService && (
                  <div
                    style={{
                      padding: '0.75rem',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '1rem',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Citizen Service Fee:</span>
                      <strong className="font-tabular" style={{ color: 'var(--accent)' }}>
                        {formatINR(currentService.citizen_fee)}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Portal Deduction:</span>
                      <span className="font-tabular">{formatINR(currentService.portal_deduction)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Panchayat Share / VCE Commission:</span>
                      <span className="font-tabular" style={{ color: '#10b981' }}>
                        {formatINR(currentService.panchayat_share)} / {formatINR(currentService.vce_commission)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Fee Collection Mode</label>
                  <select className="form-select" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                    <option value="Cash">Cash (રોકડ - In Hand)</option>
                    <option value="UPI">UPI (Google Pay / PhonePe)</option>
                    <option value="Udhar">Udhar (બાકી - Add to Citizen Khata)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Application / Acknowledgement No. (optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. GJ-REV-2026-99214"
                    value={ackNo}
                    onChange={(e) => setAckNo(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Operational Notes</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Notes or citizen instructions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontWeight: 700 }}
                  disabled={createWorkMutation.isPending}
                >
                  {createWorkMutation.isPending ? 'Generating Token...' : 'Create Application Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details & Timeline Modal */}
      {isTimelineOpen && selectedWork && (
        <div className="modal-backdrop open" onClick={() => setIsTimelineOpen(false)}>
          <div className="modal-dialog" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent)' }} />
                <h3 className="modal-title" style={{ margin: 0 }}>
                  Application Details &amp; History
                </h3>
              </div>
              <button className="modal-close" onClick={() => setIsTimelineOpen(false)} aria-label="Close" type="button">
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <span className="token-pill" style={{ fontSize: '0.9rem' }}>
                    {selectedWork.token_no || selectedWork.token_number || `TK-${selectedWork.id}`}
                  </span>
                  <h3 style={{ margin: '0.5rem 0 0.2rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {selectedWork.title}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Citizen: <strong>{selectedWork.person_name || 'Citizen'}</strong>
                    {selectedWork.person_phone && ` (${selectedWork.person_phone})`}
                  </div>
                </div>
                <span className={`badge ${getStatusClass(selectedWork.status)}`}>{selectedWork.status}</span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem',
                  padding: '0.85rem',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1rem',
                  textAlign: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Total Fee</div>
                  <div className="font-tabular" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {formatINR(selectedWork.agreed_amount)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Received</div>
                  <div className="font-tabular" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981', marginTop: '0.2rem' }}>
                    {formatINR(selectedWork.received_amount)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Pending (Udhar)</div>
                  <div
                    className="font-tabular"
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: Math.max(0, (selectedWork.agreed_amount || 0) - (selectedWork.received_amount || 0)) > 0 ? '#ef4444' : '#10b981',
                      marginTop: '0.2rem',
                    }}
                  >
                    {formatINR(Math.max(0, (selectedWork.agreed_amount || 0) - (selectedWork.received_amount || 0)))}
                  </div>
                </div>
              </div>

              {selectedWork.notes && (
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  <strong>Notes:</strong> {selectedWork.notes}
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button className="btn btn-outline" onClick={() => printReceipt(selectedWork)} type="button">
                Print Token Receipt
              </button>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button className="btn btn-outline" onClick={() => openEdit(selectedWork)} type="button">
                  ✏️ Edit Application
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    if (window.confirm('Delete application record?')) {
                      deleteWorkMutation.mutate(selectedWork.id);
                    }
                  }}
                  type="button"
                  style={{ color: 'var(--expense)' }}
                >
                  🗑️ Delete
                </button>
                <button className="btn btn-outline" onClick={() => setIsTimelineOpen(false)} type="button">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Application Modal */}
      {isEditModalOpen && selectedWork && (
        <div className="modal-backdrop open" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-dialog" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Application Status &amp; Payment</h3>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)} aria-label="Close" type="button">
                &times;
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateWorkMutation.mutate();
              }}
            >
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Application Status</label>
                  <select className="form-select" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Ready / Printed">Ready / Printed</option>
                    <option value="Completed / Delivered">Completed / Delivered</option>
                    <option value="Cancelled / Rejected">Cancelled / Rejected</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Received Fee Amount (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={(editReceivedPaise / 100).toFixed(0)}
                    onChange={(e) => setEditReceivedPaise(rupeesToPaise(e.target.value))}
                    max={(selectedWork.agreed_amount || 0) / 100}
                  />
                  <small style={{ color: 'var(--text-muted)' }}>
                    Total agreed fee: {formatINR(selectedWork.agreed_amount)}
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontWeight: 700 }}
                  disabled={updateWorkMutation.isPending}
                >
                  {updateWorkMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
export default ApplicationsPage;
