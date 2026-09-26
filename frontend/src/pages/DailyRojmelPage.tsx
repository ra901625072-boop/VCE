import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vceApi, formatINR, formatDate, getTodayDateStr, rupeesToPaise } from '../api/client';
import { RojmelData } from '../types';
import { useToast } from '../context/ToastContext';

export const DailyRojmelPage: React.FC = () => {
  const [targetDate, setTargetDate] = useState<string>(getTodayDateStr());
  const [mobileTab, setMobileTab] = useState<'aavak' | 'javak'>('aavak');

  // Modals
  const [isDayCloseOpen, setIsDayCloseOpen] = useState(false);
  const [isRemitOpen, setIsRemitOpen] = useState(false);

  // Day Close Form
  const [closingCashInput, setClosingCashInput] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  // Remittance Form
  const [remitAmount, setRemitAmount] = useState('');
  const [remitMode, setRemitMode] = useState('UPI');
  const [remitRef, setRemitRef] = useState('');

  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: rojmel, isLoading } = useQuery<RojmelData>({
    queryKey: ['rojmel', targetDate],
    queryFn: () => vceApi.getRojmel(targetDate),
  });

  const { data: profile } = useQuery({
    queryKey: ['vce-profile'],
    queryFn: () => vceApi.getProfile(),
  });

  const closeDayMutation = useMutation({
    mutationFn: async () => {
      if (!closingCashInput) throw new Error('Closing cash amount is required');
      return vceApi.closeDay({
        target_date: targetDate,
        closing_drawer_cash: rupeesToPaise(closingCashInput),
        notes: closeNotes,
      });
    },
    onSuccess: () => {
      toast.success('Rojmel Daybook successfully closed and reconciled!');
      queryClient.invalidateQueries({ queryKey: ['rojmel', targetDate] });
      setIsDayCloseOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to close day');
    },
  });

  const createRemitMutation = useMutation({
    mutationFn: async () => {
      if (!remitAmount) throw new Error('Remittance amount is required');
      return vceApi.createRemittance({
        amount: rupeesToPaise(remitAmount),
        payment_mode: remitMode,
        reference: remitRef,
        notes: `Gram Panchayat revenue remittance for ${targetDate}`,
      });
    },
    onSuccess: () => {
      toast.success('Remittance recorded successfully!');
      queryClient.invalidateQueries({ queryKey: ['rojmel', targetDate] });
      setIsRemitOpen(false);
      setRemitAmount('');
      setRemitRef('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to record remittance');
    },
  });

  const r = rojmel || {
    target_date: targetDate,
    opening_drawer_cash: 0,
    opening_bank_balance: 0,
    total_aavak: 0,
    total_javak: 0,
    aavak_cash: 0,
    aavak_upi: 0,
    javak_cash: 0,
    javak_upi: 0,
    closing_drawer_cash: 0,
    closing_bank_balance: 0,
    is_day_closed: false,
    aavak_entries: [],
    javak_entries: [],
  };

  const aavakList = r.aavak_entries || r.inflows || [];
  const javakList = r.javak_entries || r.outflows || [];
  const isDeficit = (r.closing_drawer_cash || 0) < 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Top Controls Toolbar: Date Picker & Rojmel Actions */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Select Date:</span>
          <input
            type="date"
            id="rojmel-date-picker"
            className="form-control font-tabular"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            style={{ width: '135px', padding: '0.35rem 0.55rem', fontSize: '0.825rem', fontWeight: 600 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline btn-sm"
            id="btn-open-remit-modal"
            onClick={() => setIsRemitOpen(true)}
            type="button"
            style={{ fontWeight: 600, color: 'var(--accent)', whiteSpace: 'nowrap', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span>Remit GP</span>
          </button>

          {!r.is_day_closed ? (
            <button
              className="btn btn-primary btn-sm"
              id="btn-open-day-close"
              onClick={() => {
                setClosingCashInput(((r.closing_drawer_cash || 0) / 100).toFixed(2));
                setIsDayCloseOpen(true);
              }}
              type="button"
              style={{ fontWeight: 600, whiteSpace: 'nowrap', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Close Day</span>
            </button>
          ) : (
            <span className="badge badge-completed" style={{ padding: '0.35rem 0.65rem' }}>
              Day Closed &amp; Verified
            </span>
          )}

          <button
            className="btn btn-outline btn-sm"
            id="btn-print-rojmel"
            onClick={handlePrint}
            title="Print Rojmel Sheet"
            type="button"
            style={{ fontWeight: 600, whiteSpace: 'nowrap', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Official Printable Letterhead (visible ONLY in print) */}
      <div className="print-only-header">
        <div className="print-header-top">
          <div>
            <h1 className="print-header-title">ગુજરાત સરકાર • પંચાયત, ગ્રામ ગૃહનિર્માણ અને ગ્રામ વિકાસ વિભાગ</h1>
            <div className="print-header-sub">e-Gram Vishwagram Project — VCE Digital Services Daily Cash Book (રોજમેળ)</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11pt', fontWeight: 800, color: '#111827' }} id="print-header-date">
              Date: {targetDate}
            </div>
            <div style={{ fontSize: '8pt', color: '#4b5563' }}>Official Daybook Record</div>
          </div>
        </div>
        <div className="print-header-meta">
          <span>
            Gram Panchayat: {profile?.gram_panchayat || 'Pali'} | Taluka: {profile?.taluka || 'Pali'} | District: {profile?.district || 'Gandhinagar'}
          </span>
          <span>
            Center ID: {profile?.center_id || 'GJ-1234'} | VCE: {profile?.vce_name || 'VCE Operator'}
          </span>
        </div>
      </div>

      {/* Cash Deficit Warning Alert Banner */}
      {isDeficit && (
        <div
          id="rojmel-deficit-banner"
          style={{
            marginBottom: '1.5rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid #ef4444',
            color: '#ef4444',
            padding: '0.9rem 1.25rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <strong style={{ fontSize: '0.925rem' }}>Cash Drawer Deficit Warning!</strong>
            <span style={{ fontSize: '0.825rem', opacity: 0.9, display: 'block' }}>
              Calculated closing cash in drawer is negative ({formatINR(r.closing_drawer_cash)}). Unrecorded citizen receipts or out-of-sequence payments detected.
            </span>
          </div>
        </div>
      )}

      {/* Day Close / Locked Status Banner */}
      {r.is_day_closed && (
        <div
          id="rojmel-lock-banner"
          style={{
            marginBottom: '1.5rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid #10b981',
            color: '#10b981',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Daybook Closed &amp; Verified</span>
          </div>
          <span className="badge badge-completed">Reconciled</span>
        </div>
      )}

      {/* Daily Tally Statistics Cards */}
      <section className="metrics-grid" style={{ marginBottom: '1.65rem' }}>
        {/* Opening Balances */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Opening Balances</span>
            <span className="stat-pill">Morning (શરૂઆત)</span>
          </div>
          <div style={{ marginTop: '0.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              <span>Cash Drawer:</span>
              <span className="font-tabular" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                {formatINR(r.opening_drawer_cash)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              <span>Bank / UPI:</span>
              <span className="font-tabular" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                {formatINR(r.opening_bank_balance)}
              </span>
            </div>
          </div>
        </div>

        {/* Today's Total Aavak (Inflow) */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Inflows</span>
            <span className="stat-pill revenue">+ Aavak (આવક)</span>
          </div>
          <span className="stat-value font-tabular" id="val-today-aavak">
            {formatINR(r.total_aavak)}
          </span>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            <span>
              Cash: <b className="font-tabular" style={{ color: 'var(--text-main)' }}>{formatINR(r.aavak_cash)}</b>
            </span>
            <span>
              UPI: <b className="font-tabular" style={{ color: 'var(--text-main)' }}>{formatINR(r.aavak_upi)}</b>
            </span>
          </div>
        </div>

        {/* Today's Total Javak (Outflow) */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Outflows</span>
            <span className="stat-pill expense">- Javak (જાવક)</span>
          </div>
          <span className="stat-value font-tabular" id="val-today-javak">
            {formatINR(r.total_javak)}
          </span>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            <span>
              Cash: <b className="font-tabular" style={{ color: 'var(--text-main)' }}>{formatINR(r.javak_cash)}</b>
            </span>
            <span>
              UPI: <b className="font-tabular" style={{ color: 'var(--text-main)' }}>{formatINR(r.javak_upi)}</b>
            </span>
          </div>
        </div>

        {/* Closing Balance in Drawer */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Closing Drawer</span>
            <span className="stat-pill profit">Akhar (આખર સિલક)</span>
          </div>
          <span className="stat-value font-tabular" style={{ color: isDeficit ? 'var(--expense)' : 'var(--text-main)' }}>
            {formatINR(r.closing_drawer_cash)}
          </span>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            <span>Cash on Hand</span>
            <span>
              Bank: <b className="font-tabular" style={{ color: 'var(--text-main)' }}>{formatINR(r.closing_bank_balance)}</b>
            </span>
          </div>
        </div>
      </section>

      {/* Mobile Segmented Tab Switcher */}
      <div className="segmented-control show-on-mobile-only" style={{ marginBottom: '1.15rem' }}>
        <button
          className={`segmented-tab ${mobileTab === 'aavak' ? 'active' : ''}`}
          onClick={() => setMobileTab('aavak')}
          type="button"
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--revenue)', display: 'inline-block' }} />
          <span>Inflows (આવક)</span>
        </button>
        <button
          className={`segmented-tab ${mobileTab === 'javak' ? 'active' : ''}`}
          onClick={() => setMobileTab('javak')}
          type="button"
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--expense)', display: 'inline-block' }} />
          <span>Outflows (જાવક)</span>
        </button>
      </div>

      {/* Two Column Ledger: Aavak vs Javak */}
      <div className="rojmel-dual-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.65rem' }}>
        {/* Aavak / Inflow Table */}
        <div className={`card ${mobileTab !== 'aavak' ? 'hide-on-mobile' : ''}`} id="card-aavak">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: 'var(--revenue)' }} />
              <h2 className="card-title">Inflows / Receipts (આવક)</h2>
            </div>
            <span className="badge badge-cash font-tabular" id="badge-total-aavak">
              {formatINR(r.total_aavak)}
            </span>
          </div>
          <div className="table-container hide-on-mobile">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Description / Citizen</th>
                  <th>Method</th>
                  <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody id="tbody-aavak">
                {aavakList.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                      No inflows recorded for this date
                    </td>
                  </tr>
                ) : (
                  aavakList.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                        {item.created_at ? new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>{item.title}</div>
                        {item.person_name && <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{item.person_name}</div>}
                      </td>
                      <td>
                        <span className="badge badge-waiting">{item.payment_method || 'Cash'}</span>
                      </td>
                      <td className="font-tabular" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--revenue)' }}>
                        {formatINR(item.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Javak / Outflow Table */}
        <div className={`card ${mobileTab !== 'javak' ? 'hide-on-mobile' : ''}`} id="card-javak">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: 'var(--expense)' }} />
              <h2 className="card-title">Outflows / Payments (જાવક)</h2>
            </div>
            <span className="badge badge-cancelled font-tabular" id="badge-total-javak">
              {formatINR(r.total_javak)}
            </span>
          </div>
          <div className="table-container hide-on-mobile">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Expense / Category</th>
                  <th>Method</th>
                  <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody id="tbody-javak">
                {javakList.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                      No outflows recorded for this date
                    </td>
                  </tr>
                ) : (
                  javakList.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                        {item.created_at ? new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>{item.title}</div>
                        {item.category && <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{item.category}</div>}
                      </td>
                      <td>
                        <span className="badge badge-waiting">{item.payment_method || 'Cash'}</span>
                      </td>
                      <td className="font-tabular" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--expense)' }}>
                        {formatINR(item.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Remit GP Modal */}
      {isRemitOpen && (
        <div className="modal-backdrop open" onClick={() => setIsRemitOpen(false)}>
          <div className="modal-dialog" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Gram Panchayat Revenue Remittance</h3>
              <button className="modal-close" onClick={() => setIsRemitOpen(false)} aria-label="Close" type="button">
                &times;
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createRemitMutation.mutate();
              }}
            >
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Remittance Amount (₹) *</label>
                  <input
                    type="number"
                    className="form-control font-tabular"
                    placeholder="e.g. 500"
                    value={remitAmount}
                    onChange={(e) => setRemitAmount(e.target.value)}
                    required
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Mode</label>
                  <select className="form-select" value={remitMode} onChange={(e) => setRemitMode(e.target.value)}>
                    <option value="UPI">UPI (QR Code / VPA)</option>
                    <option value="Cash">Cash to Talati</option>
                    <option value="Bank Transfer">Direct Bank Transfer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Challan / Bank Ref No. (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. UTR-9982441"
                    value={remitRef}
                    onChange={(e) => setRemitRef(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsRemitOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontWeight: 700 }}
                  disabled={createRemitMutation.isPending}
                >
                  {createRemitMutation.isPending ? 'Recording...' : 'Confirm Remittance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Day Modal */}
      {isDayCloseOpen && (
        <div className="modal-backdrop open" onClick={() => setIsDayCloseOpen(false)}>
          <div className="modal-dialog" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Close Daybook &amp; Reconcile Cash</h3>
              <button className="modal-close" onClick={() => setIsDayCloseOpen(false)} aria-label="Close" type="button">
                &times;
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                closeDayMutation.mutate();
              }}
            >
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Physical Cash Count in Drawer (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control font-tabular"
                    placeholder="Physical cash counted"
                    value={closingCashInput}
                    onChange={(e) => setClosingCashInput(e.target.value)}
                    required
                  />
                  <small style={{ color: 'var(--text-muted)' }}>
                    System expected drawer cash: {formatINR(r.closing_drawer_cash)}
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">Day Closing Notes</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Any notes or variance explanations..."
                    value={closeNotes}
                    onChange={(e) => setCloseNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsDayCloseOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontWeight: 700 }}
                  disabled={closeDayMutation.isPending}
                >
                  {closeDayMutation.isPending ? 'Closing...' : 'Close & Lock Daybook'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
export default DailyRojmelPage;
