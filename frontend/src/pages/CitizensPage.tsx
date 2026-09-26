import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { peopleApi, paymentsApi, formatINR, formatDate, rupeesToPaise } from '../api/client';
import { Citizen } from '../types';
import { useToast } from '../context/ToastContext';

export const CitizensPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [onlyUdhar, setOnlyUdhar] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCitizen, setEditingCitizen] = useState<Citizen | null>(null);
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [isKhataModalOpen, setIsKhataModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');

  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: citizens = [], isLoading } = useQuery({
    queryKey: ['citizens', search, typeFilter, onlyUdhar],
    queryFn: () => peopleApi.getAll({ query: search || undefined, type: typeFilter || undefined, only_udhar: onlyUdhar }),
  });

  const totalVillageUdhar = citizens.reduce((acc, c) => acc + (c.total_pending || 0), 0);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    village: 'Pali',
    faliyu: '',
    khata_no: '',
    ration_card_no: '',
    citizen_type: 'Farmer',
    notes: '',
  });

  const openAddModal = () => {
    setEditingCitizen(null);
    setFormData({
      name: '',
      phone: '',
      village: 'Pali',
      faliyu: '',
      khata_no: '',
      ration_card_no: '',
      citizen_type: 'Farmer',
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (citizen: Citizen) => {
    setEditingCitizen(citizen);
    setFormData({
      name: citizen.name || '',
      phone: citizen.phone || '',
      village: citizen.village || 'Pali',
      faliyu: citizen.faliyu || '',
      khata_no: citizen.khata_no || '',
      ration_card_no: citizen.ration_card_no || '',
      citizen_type: citizen.citizen_type || 'Farmer',
      notes: citizen.notes || '',
    });
    setIsAddModalOpen(true);
  };

  const openKhataLedger = (citizen: Citizen) => {
    setSelectedCitizen(citizen);
    setPayAmount(citizen.total_pending ? (citizen.total_pending / 100).toFixed(2) : '');
    setIsKhataModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formData.name.trim()) throw new Error('Citizen name is required');
      if (editingCitizen) {
        return peopleApi.update(editingCitizen.id, formData);
      }
      return peopleApi.create(formData);
    },
    onSuccess: () => {
      toast.success(editingCitizen ? 'Citizen record updated!' : 'New citizen registered!');
      queryClient.invalidateQueries({ queryKey: ['citizens'] });
      setIsAddModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save citizen');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return peopleApi.delete(id);
    },
    onSuccess: () => {
      toast.success('Citizen record removed');
      queryClient.invalidateQueries({ queryKey: ['citizens'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete citizen');
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCitizen || !payAmount) throw new Error('Payment amount required');
      return paymentsApi.create({
        person_id: selectedCitizen.id,
        amount: rupeesToPaise(payAmount),
        payment_method: payMethod,
        notes: `Khata Udhar settlement by ${selectedCitizen.name}`,
      });
    },
    onSuccess: () => {
      toast.success('Udhar settlement payment recorded!');
      queryClient.invalidateQueries({ queryKey: ['citizens'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['rojmel'] });
      setIsKhataModalOpen(false);
      setPayAmount('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Payment recording failed');
    },
  });

  return (
    <>
      {/* Search and Filter bar */}
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
              id="people-search-input"
              className="form-control"
              placeholder="Search name, village, mobile, or land khata number..."
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <select
              id="people-type-filter"
              className="form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ width: 'auto', padding: '0.55rem 0.95rem', fontSize: '0.85rem', fontWeight: 600, flex: 1, minWidth: '140px' }}
            >
              <option value="">All Categories</option>
              <option value="Farmer">Farmer (ખેડૂત)</option>
              <option value="Pensioner">Pensioner (પેન્શનર)</option>
              <option value="Student">Student (વિદ્યાર્થી)</option>
              <option value="General">General Citizen</option>
            </select>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                padding: '0.55rem 0.85rem',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                minHeight: '44px',
              }}
            >
              <input
                type="checkbox"
                id="check-only-udhar"
                checked={onlyUdhar}
                onChange={(e) => setOnlyUdhar(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ color: 'var(--expense)', fontWeight: 700 }}>Only Pending Udhar</span>
            </label>
          </div>
        </div>
      </div>

      {/* People Ledger Table & Mobile Card Feed */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 className="card-title">Citizens Directory</h2>
            <span id="people-count-badge" className="badge badge-waiting font-tabular">
              {citizens.length} Citizens
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-cancelled font-tabular" id="total-village-udhar-badge">
              Total Udhar Pending: {formatINR(totalVillageUdhar)}
            </span>
            <button
              className="btn btn-primary btn-sm"
              id="btn-add-person-top"
              onClick={openAddModal}
              type="button"
              style={{ fontWeight: 700 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Add Citizen</span>
            </button>
          </div>
        </div>

        <div className="table-container hide-on-mobile">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ minWidth: '180px' }}>Citizen Name &amp; Type</th>
                <th style={{ minWidth: '140px' }}>Village / Faliyu</th>
                <th style={{ width: '130px', minWidth: '130px' }}>Mobile No.</th>
                <th style={{ minWidth: '150px' }}>Land Khata / Ration</th>
                <th style={{ width: '100px', minWidth: '100px', textAlign: 'center' }}>Services</th>
                <th style={{ width: '105px', minWidth: '105px', textAlign: 'right' }}>Total Fee</th>
                <th style={{ width: '105px', minWidth: '105px', textAlign: 'right' }}>Received</th>
                <th style={{ width: '120px', minWidth: '120px', textAlign: 'right' }}>Udhar Balance</th>
                <th style={{ width: '160px', minWidth: '160px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody id="people-table-body">
              {isLoading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Loading citizens directory...
                  </td>
                </tr>
              ) : citizens.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                    No citizen records found.
                  </td>
                </tr>
              ) : (
                citizens.map((p) => {
                  const pending = p.total_pending || 0;
                  const isFarmer = (p.citizen_type || '').toLowerCase().includes('farmer');
                  const cleanPhone = (p.phone || '').replace(/[^0-9]/g, '');

                  return (
                    <tr key={p.id} data-person-id={p.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>{p.name}</div>
                        <span
                          className={`badge ${isFarmer ? 'badge-completed' : 'badge-waiting'}`}
                          style={{ fontSize: '0.675rem', marginTop: '0.2rem' }}
                        >
                          {p.citizen_type || 'General'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{p.village || 'Main Village'}</td>
                      <td style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                        {p.phone ? (
                          <>
                            <a href={`tel:${p.phone}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                              {p.phone}
                            </a>
                            {cleanPhone.length >= 10 && pending > 0 && (
                              <a
                                href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                                  `Hello ${p.name}, your pending balance at Gram Panchayat e-Gram Center is ${formatINR(pending)}. Please arrange for settlement.`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                title="WhatsApp Reminder"
                                style={{ marginLeft: '0.35rem', color: '#10b981', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                </svg>
                              </a>
                            )}
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        {p.khata_no && (
                          <div>
                            Khata No: <b>{p.khata_no}</b>
                          </div>
                        )}
                        {p.ration_card_no && <div>Ration: {p.ration_card_no}</div>}
                        {!p.khata_no && !p.ration_card_no && '-'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${(p.active_work_count || 0) > 0 ? 'badge-in-progress' : 'badge-completed'}`}>
                          {p.active_work_count || 0} / {p.work_count || 0}
                        </span>
                      </td>
                      <td className="font-tabular" style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatINR(p.total_agreed || 0)}
                      </td>
                      <td className="font-tabular" style={{ textAlign: 'right', color: '#10b981', fontWeight: 600 }}>
                        {formatINR(p.total_received || 0)}
                      </td>
                      <td
                        className="font-tabular"
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: pending > 0 ? '#ef4444' : '#10b981',
                        }}
                      >
                        {formatINR(pending)}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div className="table-actions">
                          <button
                            className="btn-table-action btn-view-citizen"
                            onClick={() => openKhataLedger(p)}
                            title="View Ledger & Udhar"
                            type="button"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                            <span>Ledger</span>
                          </button>
                          <button
                            className="btn-table-action btn-table-icon btn-edit-citizen"
                            onClick={() => openEditModal(p)}
                            title="Edit Citizen Profile"
                            aria-label="Edit Citizen Profile"
                            type="button"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            className="btn-table-action btn-table-icon btn-delete-citizen"
                            onClick={() => {
                              if (window.confirm(`Delete record for ${p.name}?`)) {
                                deleteMutation.mutate(p.id);
                              }
                            }}
                            title="Delete Citizen"
                            aria-label="Delete Citizen"
                            type="button"
                            style={{ color: 'var(--expense)' }}
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

        {/* Mobile Feed */}
        <div className="mobile-card-list show-on-mobile-only" style={{ padding: '0.75rem' }}>
          {citizens.map((p) => {
            const pending = p.total_pending || 0;
            const isFarmer = (p.citizen_type || '').toLowerCase().includes('farmer');

            return (
              <div className="mobile-card" key={p.id} onClick={() => openKhataLedger(p)}>
                <div className="mobile-card-header">
                  <div className="mobile-card-title-group">
                    <div className="mobile-card-title">{p.name}</div>
                    <div className="mobile-card-subtitle">
                      <span>{p.village || 'Main Village'}</span>
                      {p.phone && <span>&bull; {p.phone}</span>}
                    </div>
                  </div>
                  <span className={`badge ${isFarmer ? 'badge-completed' : 'badge-waiting'}`}>
                    {p.citizen_type || 'General'}
                  </span>
                </div>
                <div className="mobile-card-body">
                  <div className="mobile-card-metric-row">
                    <div>
                      <div className="mobile-card-metric-label">Total Services</div>
                      <div className="mobile-card-metric-val">{p.work_count || 0}</div>
                    </div>
                    <div>
                      <div className="mobile-card-metric-label">Total Fees</div>
                      <div className="mobile-card-metric-val">{formatINR(p.total_agreed || 0)}</div>
                    </div>
                    <div>
                      <div className="mobile-card-metric-label">Pending Udhar</div>
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

      {/* Add / Edit Citizen Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop open" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-dialog" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingCitizen ? 'Edit Citizen Record' : 'Register Citizen'}</h3>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)} aria-label="Close" type="button">
                &times;
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
            >
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Citizen name in Gujarati or English"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Mobile Number</label>
                    <input
                      type="tel"
                      className="form-control font-tabular"
                      placeholder="10-digit mobile"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={formData.citizen_type}
                      onChange={(e) => setFormData({ ...formData, citizen_type: e.target.value })}
                    >
                      <option value="Farmer">Farmer (ખેડૂત)</option>
                      <option value="Pensioner">Pensioner (પેન્શનર)</option>
                      <option value="Student">Student (વિદ્યાર્થી)</option>
                      <option value="General">General Citizen</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Village</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.village}
                      onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Faliyu / Ward</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.faliyu}
                      onChange={(e) => setFormData({ ...formData, faliyu: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Land Khata No.</label>
                    <input
                      type="text"
                      className="form-control font-tabular"
                      placeholder="e.g. 142/B"
                      value={formData.khata_no}
                      onChange={(e) => setFormData({ ...formData, khata_no: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Ration Card No.</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 2407..."
                      value={formData.ration_card_no}
                      onChange={(e) => setFormData({ ...formData, ration_card_no: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Save Citizen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Citizen Khata Statement & Settlement Modal */}
      {isKhataModalOpen && selectedCitizen && (
        <div className="modal-backdrop open" onClick={() => setIsKhataModalOpen(false)}>
          <div className="modal-dialog" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Citizen Khata Ledger — {selectedCitizen.name}</h3>
              <button className="modal-close" onClick={() => setIsKhataModalOpen(false)} aria-label="Close" type="button">
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Village &amp; Category</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {selectedCitizen.village || 'Pali'} &bull; {selectedCitizen.citizen_type || 'General'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Outstanding Udhar</div>
                  <div
                    className="font-tabular"
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: (selectedCitizen.total_pending || 0) > 0 ? '#ef4444' : '#10b981',
                      marginTop: '0.2rem',
                    }}
                  >
                    {formatINR(selectedCitizen.total_pending || 0)}
                  </div>
                </div>
              </div>

              {/* Settlement Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  recordPaymentMutation.mutate();
                }}
              >
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  Record Payment Settlement (રોકડ જમા)
                </h4>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Payment Amount (₹) *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="e.g. 50"
                      required
                      min="1"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Payment Method</label>
                    <select className="form-select" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                      <option value="Cash">Cash (રોકડ)</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ fontWeight: 700 }}
                    disabled={recordPaymentMutation.isPending}
                  >
                    {recordPaymentMutation.isPending ? 'Processing...' : 'Accept Settlement'}
                  </button>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setIsKhataModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default CitizensPage;
