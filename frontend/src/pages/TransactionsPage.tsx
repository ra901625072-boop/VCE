import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, paymentsApi, expensesApi, formatINR, formatDate, rupeesToPaise } from '../api/client';
import { useToast } from '../context/ToastContext';

export const TransactionsPage: React.FC = () => {
  const [activeType, setActiveType] = useState<'all' | 'payment' | 'expense' | 'udhar'>('all');
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('');
  const [preset, setPreset] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Quick modals for Record Receipt & Record Expense
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Form states
  const [rcptPerson, setRcptPerson] = useState('');
  const [rcptAmount, setRcptAmount] = useState('');
  const [rcptMethod, setRcptMethod] = useState('Cash');
  const [rcptNotes, setRcptNotes] = useState('');

  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('Center Supplies');
  const [expMethod, setExpMethod] = useState('Cash');
  const [expNotes, setExpNotes] = useState('');

  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['transactions', activeType, search, method, preset, dateFrom, dateTo],
    queryFn: async () => {
      let types = ['payment', 'expense'];
      if (activeType === 'payment') types = ['payment'];
      if (activeType === 'expense') types = ['expense'];
      if (activeType === 'udhar') types = ['payment'];

      const res = await api.get<{ results: { payments?: any[]; expenses?: any[] } }>('/search', {
        q: search || undefined,
        types,
        payment_method: activeType === 'udhar' ? 'Udhar' : method || undefined,
        preset: preset === 'all' ? undefined : preset,
        date_from: preset === 'custom' ? dateFrom : undefined,
        date_to: preset === 'custom' ? dateTo : undefined,
      });

      const combined: any[] = [];

      if (res.results.payments) {
        res.results.payments.forEach((p) => {
          if (activeType === 'udhar' && p.payment_method?.toLowerCase() !== 'udhar') return;
          combined.push({
            id: p.id,
            rawType: 'payment',
            type: p.payment_method?.toLowerCase() === 'udhar' ? 'Udhar' : 'Receipt',
            date: p.payment_date,
            time: p.payment_time,
            entity: p.person_name || 'Walk-in Citizen',
            work: p.work_title || 'General Flow',
            method: p.payment_method || 'Cash',
            reference: p.transaction_reference,
            amount: p.amount,
            notes: p.notes,
            is_income: p.payment_method?.toLowerCase() !== 'udhar',
          });
        });
      }

      if (res.results.expenses && activeType !== 'payment' && activeType !== 'udhar') {
        res.results.expenses.forEach((e) => {
          combined.push({
            id: e.id,
            rawType: 'expense',
            type: 'Expense',
            date: e.expense_date,
            time: e.expense_time,
            entity: e.paid_to || 'Center Vendor',
            work: e.title,
            method: e.payment_method || 'Cash',
            reference: e.receipt_number,
            amount: e.amount,
            notes: e.category,
            is_income: false,
          });
        });
      }

      combined.sort((a, b) => {
        const da = new Date(`${a.date}T${a.time || '00:00:00'}`).getTime();
        const db = new Date(`${b.date}T${b.time || '00:00:00'}`).getTime();
        return db - da;
      });

      return combined;
    },
  });

  const transactions = searchResults || [];
  const totalInflows = transactions.filter((t) => t.is_income).reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalOutflows = transactions.filter((t) => !t.is_income && t.type !== 'Udhar').reduce((acc, t) => acc + (t.amount || 0), 0);
  const netBalance = totalInflows - totalOutflows;

  // Create Receipt Mutation
  const createReceiptMutation = useMutation({
    mutationFn: async () => {
      if (!rcptAmount) throw new Error('Amount is required');
      return paymentsApi.create({
        amount: rupeesToPaise(rcptAmount),
        payment_method: rcptMethod,
        notes: `${rcptPerson ? `Received from ${rcptPerson}: ` : ''}${rcptNotes}`,
      });
    },
    onSuccess: () => {
      toast.success('Receipt recorded successfully!');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['rojmel'] });
      setIsReceiptModalOpen(false);
      setRcptPerson('');
      setRcptAmount('');
      setRcptNotes('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to record receipt');
    },
  });

  // Create Expense Mutation
  const createExpenseMutation = useMutation({
    mutationFn: async () => {
      if (!expTitle || !expAmount) throw new Error('Title and Amount are required');
      return expensesApi.create({
        title: expTitle,
        category: expCategory,
        category_name: expCategory,
        amount: rupeesToPaise(expAmount),
        payment_method: expMethod,
        notes: expNotes,
      });
    },
    onSuccess: () => {
      toast.success('Expense recorded successfully!');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['rojmel'] });
      setIsExpenseModalOpen(false);
      setExpTitle('');
      setExpAmount('');
      setExpNotes('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to record expense');
    },
  });

  return (
    <>
      {/* Action Strip: Record Receipt & Record Expense */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginBottom: '1.25rem' }}>
        <button
          className="btn btn-primary btn-sm"
          id="btn-add-pay-top"
          onClick={() => setIsReceiptModalOpen(true)}
          type="button"
          style={{ fontWeight: 700 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <span>Record Receipt (આવક)</span>
        </button>
        <button
          className="btn btn-outline btn-sm"
          id="btn-add-exp-top"
          onClick={() => setIsExpenseModalOpen(true)}
          type="button"
          style={{ fontWeight: 700, color: 'var(--expense)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          <span>Record Expense (જાવક)</span>
        </button>
      </div>

      {/* Multi-Filter Control Panel */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-body" style={{ padding: '1rem 1.25rem' }}>
          {/* Filter Tabs */}
          <div className="trans-tab-strip" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm trans-tab ${activeType === 'all' ? 'btn-primary active' : 'btn-outline'}`}
              onClick={() => setActiveType('all')}
              type="button"
            >
              All Cash Flow
            </button>
            <button
              className={`btn btn-sm trans-tab ${activeType === 'payment' ? 'btn-primary active' : 'btn-outline'}`}
              onClick={() => setActiveType('payment')}
              type="button"
            >
              Receipts (આવક)
            </button>
            <button
              className={`btn btn-sm trans-tab ${activeType === 'expense' ? 'btn-primary active' : 'btn-outline'}`}
              onClick={() => setActiveType('expense')}
              type="button"
            >
              Expenses (જાવક)
            </button>
            <button
              className={`btn btn-sm trans-tab ${activeType === 'udhar' ? 'btn-primary active' : 'btn-outline'}`}
              onClick={() => setActiveType('udhar')}
              type="button"
            >
              Udhar (ઉધાર)
            </button>
          </div>

          {/* Search Query & Filter Toggle */}
          <div className="trans-search-row" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                id="filter-query"
                className="form-control"
                placeholder="Search citizen, vendor, receipt no, details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.4rem' }}
              />
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-muted)"
                strokeWidth="2"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm trans-filter-toggle-btn"
              onClick={() => setFiltersOpen(!filtersOpen)}
              title="Toggle More Filters"
              aria-label="Toggle More Filters"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span>Filters</span>
            </button>
          </div>

          {/* Collapsible Secondary Filter Drawer */}
          {filtersOpen && (
            <div style={{ marginTop: '0.85rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', alignItems: 'end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>
                    Payment Method
                  </label>
                  <select className="form-select" value={method} onChange={(e) => setMethod(e.target.value)}>
                    <option value="">All Methods</option>
                    <option value="Cash">Cash (રોકડ)</option>
                    <option value="UPI">UPI (Google Pay / PhonePe)</option>
                    <option value="Online">Online / Portal</option>
                    <option value="Udhar">Udhar (બાકી)</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>
                    Date Filter
                  </label>
                  <select className="form-select" value={preset} onChange={(e) => setPreset(e.target.value)}>
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="this_week">This Week</option>
                    <option value="this_month">This Month</option>
                    <option value="this_year">This Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                {preset === 'custom' && (
                  <>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>
                        From
                      </label>
                      <input
                        type="date"
                        className="form-control font-tabular"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>
                        To
                      </label>
                      <input
                        type="date"
                        className="form-control font-tabular"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                      />
                    </div>
                  </>
                )}
                <div>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setSearch('');
                      setMethod('');
                      setPreset('all');
                      setDateFrom('');
                      setDateTo('');
                    }}
                    type="button"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ledger Table & Mobile Card Feed */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 className="card-title">Ledger Journal</h2>
            <span id="trans-count-badge" className="badge badge-waiting font-tabular">
              {transactions.length} Entries
            </span>
          </div>
          <span className="badge badge-completed font-tabular" id="trans-net-badge">
            Net Surplus: {formatINR(netBalance)}
          </span>
        </div>

        <div className="table-container hide-on-mobile">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '130px', minWidth: '130px' }}>Time / Date</th>
                <th style={{ width: '110px', minWidth: '110px' }}>Type</th>
                <th style={{ minWidth: '180px' }}>Beneficiary / Vendor</th>
                <th style={{ minWidth: '200px' }}>Description &amp; Category</th>
                <th style={{ width: '120px', minWidth: '120px' }}>Method</th>
                <th style={{ width: '110px', minWidth: '110px', textAlign: 'right' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                    No transactions found for the selected filter.
                  </td>
                </tr>
              ) : (
                transactions.map((t, idx) => {
                  const isExp = t.rawType === 'expense';
                  const isUdh = t.type === 'Udhar';

                  return (
                    <tr key={idx}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-main)', fontWeight: 600 }}>{formatDate(t.date)}</div>
                        {t.time && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.time}</div>}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span
                          className={`badge ${
                            isExp ? 'badge-cancelled' : isUdh ? 'badge-waiting' : 'badge-completed'
                          }`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>{t.entity}</div>
                        {t.reference && <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Ref: {t.reference}</div>}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.work}</div>
                        {t.notes && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.notes}</div>}
                      </td>
                      <td>
                        <span className="badge badge-waiting">{t.method}</span>
                      </td>
                      <td
                        className="font-tabular"
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: isExp ? 'var(--expense)' : isUdh ? 'var(--pending)' : 'var(--revenue)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isExp ? `-${formatINR(t.amount)}` : `+${formatINR(t.amount)}`}
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
          {transactions.map((t, idx) => (
            <div className="mobile-card" key={idx}>
              <div className="mobile-card-header">
                <div className="mobile-card-title-group">
                  <div className="mobile-card-title">{t.entity}</div>
                  <div className="mobile-card-subtitle">{formatDate(t.date)} &bull; {t.method}</div>
                </div>
                <span className={`badge ${t.rawType === 'expense' ? 'badge-cancelled' : 'badge-completed'}`}>
                  {t.type}
                </span>
              </div>
              <div className="mobile-card-body">
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>{t.work}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.notes || '—'}</span>
                  <span
                    className="font-tabular"
                    style={{
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: t.rawType === 'expense' ? 'var(--expense)' : 'var(--revenue)',
                    }}
                  >
                    {t.rawType === 'expense' ? `-${formatINR(t.amount)}` : `+${formatINR(t.amount)}`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Record Receipt Modal */}
      {isReceiptModalOpen && (
        <div className="modal-backdrop open" onClick={() => setIsReceiptModalOpen(false)}>
          <div className="modal-dialog" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Record Direct Receipt (આવક પાવતી)</h3>
              <button className="modal-close" onClick={() => setIsReceiptModalOpen(false)} aria-label="Close" type="button">
                &times;
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createReceiptMutation.mutate();
              }}
            >
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Received From (Citizen / Source)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Walk-in Citizen or Source"
                    value={rcptPerson}
                    onChange={(e) => setRcptPerson(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Receipt Amount (₹) *</label>
                  <input
                    type="number"
                    className="form-control font-tabular"
                    placeholder="e.g. 50"
                    value={rcptAmount}
                    onChange={(e) => setRcptAmount(e.target.value)}
                    required
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="form-select" value={rcptMethod} onChange={(e) => setRcptMethod(e.target.value)}>
                    <option value="Cash">Cash (રોકડ)</option>
                    <option value="UPI">UPI / PhonePe / GPay</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Details / Purpose</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Form fee, photocopy, printout"
                    value={rcptNotes}
                    onChange={(e) => setRcptNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsReceiptModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }} disabled={createReceiptMutation.isPending}>
                  {createReceiptMutation.isPending ? 'Recording...' : 'Save Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {isExpenseModalOpen && (
        <div className="modal-backdrop open" onClick={() => setIsExpenseModalOpen(false)}>
          <div className="modal-dialog" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Record Center Expense (જાવક ખર્ચ)</h3>
              <button className="modal-close" onClick={() => setIsExpenseModalOpen(false)} aria-label="Close" type="button">
                &times;
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createExpenseMutation.mutate();
              }}
            >
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Expense Description *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. A4 Paper Rim, Toner Refill, Broadband"
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Amount (₹) *</label>
                    <input
                      type="number"
                      className="form-control font-tabular"
                      placeholder="e.g. 280"
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      required
                      min="1"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Category</label>
                    <select className="form-select" value={expCategory} onChange={(e) => setExpCategory(e.target.value)}>
                      <option value="Paper & Stationery">Paper &amp; Stationery</option>
                      <option value="Printer & Toner">Printer &amp; Toner</option>
                      <option value="Broadband & Internet">Broadband &amp; Internet</option>
                      <option value="Electricity & Utilities">Electricity &amp; Utilities</option>
                      <option value="Hardware Maintenance">Hardware Maintenance</option>
                      <option value="Tea & Office Refreshment">Tea &amp; Office</option>
                      <option value="Travel & Misc">Travel &amp; Misc</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="form-select" value={expMethod} onChange={(e) => setExpMethod(e.target.value)}>
                    <option value="Cash">Cash (રોકડ Drawer)</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Vendor / Bill Notes</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Gayatri Stationery, Bill #102"
                    value={expNotes}
                    onChange={(e) => setExpNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsExpenseModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: 'var(--expense)', borderColor: 'var(--expense)', fontWeight: 700 }}
                  disabled={createExpenseMutation.isPending}
                >
                  {createExpenseMutation.isPending ? 'Recording...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
export default TransactionsPage;
