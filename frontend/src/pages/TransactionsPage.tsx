import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, paymentsApi, expensesApi, peopleApi, formatINR, formatDate, rupeesToPaise } from '../api/client';
import { Citizen } from '../types';
import { useToast } from '../context/ToastContext';
import { Skeleton } from '../components/common/Skeleton';

const INCOME_PRESETS = [
  { label: 'Walk-in Citizen', guj: 'વોક-ઈન નાગરિક', icon: '👤', notes: 'Walk-in counter citizen service' },
  { label: 'Photocopy / Xerox', guj: 'ઝેરોક્ષ આવક', icon: '🖨️', notes: 'Document photocopy charges' },
  { label: 'Printout / Scanning', guj: 'પ્રિન્ટ / સ્કેનિંગ', icon: '📄', notes: 'Online application printout & scan' },
  { label: 'Lamination', guj: 'લેમિનેશન', icon: '🪪', notes: 'Certificate / Aadhaar card lamination' },
  { label: 'CSC / Commission', guj: 'પોર્ટલ કમિશન', icon: '🏛️', notes: 'CSC / Digital Gujarat incentive commission' },
  { label: 'Certificate Typing', guj: 'અરજી ટાઈપિંગ', icon: '📑', notes: 'Affidavit & revenue application typing fee' },
  { label: 'Panchayat Share', guj: 'પંચાયત આવક', icon: '🏦', notes: 'Gram Panchayat local revenue share' },
  { label: 'Miscellaneous', guj: 'પરચૂરણ આવક', icon: '💰', notes: 'General center cash receipt' },
];

const UDHAR_PRESETS = [
  { label: '7/12 & 8-A Nakal', guj: '૭/૧૨ નકલ', icon: '📜', notes: '7/12 land record copy fees pending' },
  { label: 'Govt Scheme Form', guj: 'યોજના અરજી', icon: '📝', notes: 'Online scheme application form fee' },
  { label: 'Aadhaar / Voter ID', guj: 'આધાર / ચૂંટણી કાર્ડ', icon: '🪪', notes: 'Card download & PVC print charge' },
  { label: 'iKhedut Scheme', guj: 'ખેડૂત અરજી', icon: '🌾', notes: 'iKhedut subsidy application fee' },
  { label: 'Photocopy / Print', guj: 'ઝેરોક્ષ / પ્રિન્ટ', icon: '🖨️', notes: 'Photocopies and document printouts' },
  { label: 'Electricity / Bill', guj: 'લાઈટ બિલ ચલણ', icon: '⚡', notes: 'Utility bill submission charge' },
];

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

  // Receipt Form states (Dual-mode: Citizen or Other Income Source)
  const [rcptSourceType, setRcptSourceType] = useState<'citizen' | 'other'>('citizen');
  const [rcptCitizenId, setRcptCitizenId] = useState<number | ''>('');
  const [rcptCitizenSearch, setRcptCitizenSearch] = useState('');
  const [rcptCustomSource, setRcptCustomSource] = useState('Walk-in Citizen');
  const [rcptAutoCreatePerson, setRcptAutoCreatePerson] = useState(false);
  const [rcptAmount, setRcptAmount] = useState('');
  const [rcptMethod, setRcptMethod] = useState('Cash');
  const [rcptRef, setRcptRef] = useState('');
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
    placeholderData: (previousData) => previousData,
  });

  const transactions = searchResults || [];
  const totalInflows = transactions.filter((t) => t.is_income).reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalOutflows = transactions.filter((t) => !t.is_income && t.type !== 'Udhar').reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalUdhar = transactions.filter((t) => t.type === 'Udhar').reduce((acc, t) => acc + (t.amount || 0), 0);
  const netBalance = totalInflows - totalOutflows;

  // Fetch registered citizens for selection
  const { data: citizens = [] } = useQuery({
    queryKey: ['citizens-list'],
    queryFn: () => peopleApi.getAll(),
  });

  const resetReceiptForm = () => {
    setRcptSourceType('citizen');
    setRcptCitizenId('');
    setRcptCitizenSearch('');
    setRcptCustomSource('Walk-in Citizen');
    setRcptAutoCreatePerson(false);
    setRcptAmount('');
    setRcptMethod('Cash');
    setRcptRef('');
    setRcptNotes('');
  };

  // Create Receipt or Udhar Mutation
  const createReceiptMutation = useMutation({
    mutationFn: async () => {
      const numAmt = parseFloat(rcptAmount);
      if (isNaN(numAmt) || numAmt <= 0) {
        throw new Error('Please enter a valid amount in rupees');
      }

      const isCitizenMode = rcptSourceType === 'citizen';
      const isUdhar = rcptMethod === 'Udhar';

      if (isUdhar && !isCitizenMode && !rcptAutoCreatePerson && !rcptCitizenId) {
        throw new Error('Udhar credit must be linked to a citizen. Please select a registered citizen or check "Register as new Citizen".');
      }

      if (isCitizenMode && !rcptCitizenId) {
        throw new Error('Please select a registered citizen from the list');
      }
      if (!isCitizenMode && !rcptCustomSource.trim()) {
        throw new Error('Please enter a citizen name or income source');
      }

      const selectedCitizen = isCitizenMode ? citizens.find((c) => c.id === rcptCitizenId) : null;
      const personName = isCitizenMode ? selectedCitizen?.name : rcptCustomSource.trim();

      return paymentsApi.create({
        person_id: isCitizenMode ? Number(rcptCitizenId) : undefined,
        person_name: personName,
        auto_create_person: !isCitizenMode && (rcptAutoCreatePerson || isUdhar),
        amount: rupeesToPaise(rcptAmount),
        payment_method: rcptMethod,
        transaction_reference: rcptRef.trim() || undefined,
        payment_date: new Date().toISOString().split('T')[0],
        payment_time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        notes: rcptNotes.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success(rcptMethod === 'Udhar' ? 'Udhar credit recorded to citizen khata!' : 'Receipt recorded successfully!');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['citizens'] });
      queryClient.invalidateQueries({ queryKey: ['citizens-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['rojmel'] });
      setIsReceiptModalOpen(false);
      resetReceiptForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to record transaction');
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
  // Filter citizens based on live search
  const filteredCitizens = citizens.filter((c: Citizen) => {
    if (!rcptCitizenSearch.trim()) return true;
    const q = rcptCitizenSearch.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.village && c.village.toLowerCase().includes(q))
    );
  });

  const selectedCitizen = rcptCitizenId ? citizens.find((c: Citizen) => c.id === rcptCitizenId) : null;

  return (
    <>
      {/* Action Strip: Record Receipt, Record Udhar & Record Expense */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button
          className="btn btn-primary btn-sm"
          id="btn-add-pay-top"
          onClick={() => {
            resetReceiptForm();
            setRcptMethod('Cash');
            setIsReceiptModalOpen(true);
          }}
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
          className="btn btn-sm"
          id="btn-add-udhar-top"
          onClick={() => {
            resetReceiptForm();
            setRcptMethod('Udhar');
            setRcptSourceType('citizen');
            setIsReceiptModalOpen(true);
          }}
          type="button"
          style={{
            fontWeight: 700,
            color: '#f59e0b',
            background: 'rgba(217, 119, 6, 0.12)',
            border: '1px solid rgba(217, 119, 6, 0.38)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Record Udhar (ઉધાર આપો)</span>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {activeType === 'udhar' ? (
              <span
                className="badge font-tabular"
                id="trans-udhar-badge"
                style={{
                  color: '#f59e0b',
                  background: 'rgba(217, 119, 6, 0.15)',
                  border: '1px solid rgba(217, 119, 6, 0.35)',
                  fontWeight: 700,
                }}
              >
                Total Udhar: {formatINR(totalUdhar)}
              </span>
            ) : (
              <span className="badge badge-completed font-tabular" id="trans-net-badge">
                Net Surplus: {formatINR(netBalance)}
              </span>
            )}
          </div>
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
            <tbody id="transactions-table-body">
              {isLoading && transactions.length === 0 ? (
                Array.from({ length: 6 }).map((_, rIdx) => (
                  <tr key={rIdx} className="skeleton-row" aria-hidden="true">
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Skeleton width="85px" height="0.85rem" variant="text" />
                        <Skeleton width="55px" height="0.7rem" variant="text" />
                      </div>
                    </td>
                    <td><Skeleton width="75px" height="22px" variant="rounded" style={{ borderRadius: '10px' }} /></td>
                    <td><Skeleton width="140px" height="0.9rem" variant="text" /></td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Skeleton width="160px" height="0.85rem" variant="text" />
                        <Skeleton width="90px" height="0.7rem" variant="text" />
                      </div>
                    </td>
                    <td><Skeleton width="70px" height="0.85rem" variant="text" /></td>
                    <td style={{ textAlign: 'right' }}><Skeleton width="75px" height="1rem" variant="text" style={{ marginLeft: 'auto' }} /></td>
                  </tr>
                ))
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
                        {isExp ? `-${formatINR(t.amount)}` : isUdh ? `⚠️ ${formatINR(t.amount)}` : `+${formatINR(t.amount)}`}
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
          {isLoading && transactions.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div className="mobile-card" key={i} style={{ minHeight: '110px' }} aria-hidden="true">
                <div className="mobile-card-header" style={{ marginBottom: '0.5rem' }}>
                  <div style={{ width: '65%' }}>
                    <Skeleton width="80%" height="1.05rem" variant="text" style={{ marginBottom: '4px' }} />
                    <Skeleton width="50%" height="0.75rem" variant="text" />
                  </div>
                  <Skeleton width="65px" height="20px" variant="rounded" style={{ borderRadius: '10px' }} />
                </div>
                <Skeleton width="75%" height="0.85rem" variant="text" style={{ marginBottom: '0.5rem' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                  <Skeleton width="60px" height="0.8rem" variant="text" />
                  <Skeleton width="70px" height="0.95rem" variant="text" />
                </div>
              </div>
            ))
          ) : transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-dim)' }}>
              No transactions found for the selected filter.
            </div>
          ) : (
            transactions.map((t, idx) => (
              <div className="mobile-card" key={idx}>
                <div className="mobile-card-header">
                  <div className="mobile-card-title-group">
                    <div className="mobile-card-title">{t.entity}</div>
                    <div className="mobile-card-subtitle">{formatDate(t.date)} &bull; {t.method}</div>
                  </div>
                  <span className={`badge ${t.rawType === 'expense' ? 'badge-cancelled' : t.type === 'Udhar' ? 'badge-waiting' : 'badge-completed'}`}>
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
                        color: t.rawType === 'expense' ? 'var(--expense)' : t.type === 'Udhar' ? 'var(--pending)' : 'var(--revenue)',
                      }}
                    >
                      {t.rawType === 'expense' ? `-${formatINR(t.amount)}` : t.type === 'Udhar' ? `⚠️ ${formatINR(t.amount)}` : `+${formatINR(t.amount)}`}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Record Receipt Modal (Dual-Mode: Registered Citizen vs Walk-in / Other Income Source) */}
      {isReceiptModalOpen && (
        <div className="modal-backdrop open" onClick={() => { setIsReceiptModalOpen(false); resetReceiptForm(); }}>
          <div className="modal-dialog" style={{ maxWidth: '520px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div
              className="modal-header"
              style={{
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--border-subtle)',
                background: rcptMethod === 'Udhar' ? 'rgba(217, 119, 6, 0.05)' : undefined,
              }}
            >
              <div>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <span style={{ color: rcptMethod === 'Udhar' ? '#f59e0b' : 'var(--revenue)' }}>
                    {rcptMethod === 'Udhar' ? '⏳' : '✦'}
                  </span>
                  <span>
                    {rcptMethod === 'Udhar'
                      ? 'Record Direct Udhar Credit (ઉધાર નોંધણી / ખાતામાં બાકી)'
                      : 'Record Direct Receipt (આવક પાવતી)'}
                  </span>
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {rcptMethod === 'Udhar'
                    ? 'Village Resident Credit & Outstanding Ledger'
                    : 'e-Gram Center Revenue & Citizen Fee Ledger'}
                </p>
              </div>
              <button
                className="modal-close"
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  resetReceiptForm();
                }}
                aria-label="Close"
                type="button"
              >
                &times;
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createReceiptMutation.mutate();
              }}
            >
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem 1.5rem' }}>
                {/* Mode Selector Segmented Control */}
                <div>
                  <label className="form-label" style={{ fontSize: '0.785rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block' }}>
                    Income Payer / Category *
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      background: 'var(--bg-surface-elevated)',
                      padding: '0.25rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      gap: '0.25rem',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setRcptSourceType('citizen')}
                      style={{
                        flex: 1,
                        padding: '0.55rem 0.75rem',
                        borderRadius: 'var(--radius-xs)',
                        border: 'none',
                        background: rcptSourceType === 'citizen' ? 'var(--bg-surface)' : 'transparent',
                        color: rcptSourceType === 'citizen' ? 'var(--accent)' : 'var(--text-muted)',
                        fontWeight: rcptSourceType === 'citizen' ? 700 : 500,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        boxShadow: rcptSourceType === 'citizen' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>👤</span>
                      <span>Registered Citizen (નાગરિક)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRcptSourceType('other')}
                      style={{
                        flex: 1,
                        padding: '0.55rem 0.75rem',
                        borderRadius: 'var(--radius-xs)',
                        border: 'none',
                        background: rcptSourceType === 'other' ? 'var(--bg-surface)' : 'transparent',
                        color: rcptSourceType === 'other' ? 'var(--accent)' : 'var(--text-muted)',
                        fontWeight: rcptSourceType === 'other' ? 700 : 500,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        boxShadow: rcptSourceType === 'other' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>📄</span>
                      <span>Walk-in / Other Source (અન્ય આવક)</span>
                    </button>
                  </div>
                </div>

                {/* Sub-form 1: Registered Citizen Selection */}
                {rcptSourceType === 'citizen' ? (
                  <div
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <label className="form-label" style={{ fontSize: '0.785rem', fontWeight: 600, margin: 0 }}>
                          Select Citizen from Village Registry *
                        </label>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          {citizens.length} registered
                        </span>
                      </div>

                      {/* Filter search box for citizens */}
                      {citizens.length > 5 && (
                        <div style={{ position: 'relative', marginBottom: '0.45rem' }}>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Filter by name, mobile, or village..."
                            value={rcptCitizenSearch}
                            onChange={(e) => setRcptCitizenSearch(e.target.value)}
                            style={{
                              fontSize: '0.775rem',
                              padding: '0.35rem 0.6rem 0.35rem 1.8rem',
                              height: 'auto',
                            }}
                          />
                          <span style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.75rem' }}>
                            🔍
                          </span>
                        </div>
                      )}

                      <select
                        className="form-select"
                        value={rcptCitizenId}
                        onChange={(e) => setRcptCitizenId(e.target.value ? Number(e.target.value) : '')}
                        required={rcptSourceType === 'citizen'}
                        style={{ fontWeight: 600 }}
                      >
                        <option value="">-- Choose Citizen (નાગરિક પસંદ કરો) --</option>
                        {filteredCitizens.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.village ? `(${c.village})` : ''} {c.phone ? `• ${c.phone}` : ''} {c.total_pending && c.total_pending > 0 ? `• [બાકી: ₹${(c.total_pending / 100).toFixed(0)}]` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Citizen Selected Preview Card */}
                    {selectedCitizen ? (
                      <div
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-xs)',
                          padding: '0.65rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'rgba(194,65,12,0.12)',
                              color: 'var(--accent)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              flexShrink: 0,
                            }}
                          >
                            {(selectedCitizen.name[0] || 'N').toUpperCase()}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {selectedCitizen.name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {selectedCitizen.village || 'Pali'} {selectedCitizen.phone ? `• ${selectedCitizen.phone}` : ''}
                            </div>
                          </div>
                        </div>

                        <div>
                          {selectedCitizen.total_pending && selectedCitizen.total_pending > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.2rem 0.5rem',
                                  background: 'rgba(217,119,6,0.15)',
                                  color: '#f59e0b',
                                  border: '1px solid rgba(217,119,6,0.3)',
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                <span>⚠️ બાકી ઉધાર:</span>
                                <span className="font-tabular">{formatINR(selectedCitizen.total_pending)}</span>
                              </span>
                              {rcptMethod !== 'Udhar' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRcptAmount(String(((selectedCitizen.total_pending || 0) / 100).toFixed(0)));
                                    setRcptNotes(`Udhar settlement for ${selectedCitizen.name}`);
                                  }}
                                  title="Fill outstanding amount to settle Udhar"
                                  style={{
                                    padding: '0.2rem 0.45rem',
                                    background: 'rgba(5, 150, 105, 0.15)',
                                    border: '1px solid rgba(5, 150, 105, 0.3)',
                                    borderRadius: '4px',
                                    color: 'var(--revenue)',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  Settle (જમા)
                                </button>
                              )}
                            </div>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.2rem 0.45rem',
                                background: 'rgba(5,150,105,0.12)',
                                color: 'var(--revenue)',
                                border: '1px solid rgba(5,150,105,0.25)',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              ✓ કોઈ ઉધાર નથી
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                          Need to record for a walk-in or other income?
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setRcptSourceType('other');
                            setRcptCustomSource('Walk-in Citizen');
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent)',
                            fontSize: '0.725rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0,
                            textDecoration: 'underline',
                          }}
                        >
                          Switch to Walk-in &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Sub-form 2: Walk-in / Other Income Source Mode */
                  <div
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                    }}
                  >
                    {/* Quick Preset Chips */}
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>
                        Quick Presets (વારંવાર વપરાતી આવક):
                      </label>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {INCOME_PRESETS.map((p) => {
                          const isSelected = rcptCustomSource === p.label;
                          return (
                            <button
                              key={p.label}
                              type="button"
                              onClick={() => {
                                setRcptCustomSource(p.label);
                                if (!rcptNotes || INCOME_PRESETS.some((ip) => ip.notes === rcptNotes)) {
                                  setRcptNotes(p.notes);
                                }
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: 'var(--radius-xs)',
                                fontSize: '0.725rem',
                                fontWeight: isSelected ? 700 : 500,
                                background: isSelected ? 'rgba(194,65,12,0.18)' : 'var(--bg-surface)',
                                border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-subtle)'}`,
                                color: isSelected ? 'var(--accent-light)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <span>{p.icon}</span>
                              <span>{p.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Source Input */}
                    <div>
                      <label className="form-label" style={{ fontSize: '0.785rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                        Citizen Name or Income Source *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Walk-in Citizen, Photocopy, CSC Commission, Gram Panchayat..."
                        value={rcptCustomSource}
                        onChange={(e) => setRcptCustomSource(e.target.value)}
                        required={rcptSourceType === 'other'}
                        style={{ fontWeight: 600 }}
                      />
                    </div>

                    {/* Auto-create Citizen Checkbox */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        userSelect: 'none',
                        background: 'var(--bg-surface)',
                        padding: '0.45rem 0.6rem',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px dashed var(--border-subtle)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={rcptAutoCreatePerson}
                        onChange={(e) => setRcptAutoCreatePerson(e.target.checked)}
                        style={{ accentColor: 'var(--accent)', marginTop: '2px' }}
                      />
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>
                          Register as new Citizen in Khata Directory (નાગરિક તરીકે ખાતાવહીમાં સેવ કરો)
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                          Creates a permanent ledger account so you can track future work &amp; Udhar for this person.
                        </span>
                      </div>
                    </label>
                  </div>
                )}

                {/* Receipt Amount (₹) */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.785rem', fontWeight: 600, marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Receipt Amount (રકમ ₹) *</span>
                    {rcptAmount && !isNaN(parseFloat(rcptAmount)) && parseFloat(rcptAmount) > 0 && (
                      <span style={{ color: 'var(--revenue)', fontWeight: 700 }}>
                        {formatINR(rupeesToPaise(rcptAmount))}
                      </span>
                    )}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      className="form-control font-tabular"
                      placeholder="0.00"
                      value={rcptAmount}
                      onChange={(e) => setRcptAmount(e.target.value)}
                      required
                      min="1"
                      style={{ paddingLeft: '1.8rem', fontSize: '1.05rem', fontWeight: 700 }}
                    />
                  </div>

                  {/* Quick Amount Increment Chips */}
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                    {[10, 20, 50, 100, 200, 500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          const curr = parseFloat(rcptAmount) || 0;
                          setRcptAmount(String(curr + amt));
                        }}
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-xs)',
                          background: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.725rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        +₹{amt}
                      </button>
                    ))}
                    {rcptAmount && (
                      <button
                        type="button"
                        onClick={() => setRcptAmount('')}
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-xs)',
                          background: 'transparent',
                          border: '1px dashed var(--border-subtle)',
                          color: 'var(--text-muted)',
                          fontSize: '0.725rem',
                          cursor: 'pointer',
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.785rem', fontWeight: 600, marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Payment / Credit Mode (ચુકવણી પદ્ધતિ) *</span>
                    {rcptMethod === 'Udhar' && (
                      <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700 }}>
                        ● Added to Citizen Udhar Khata
                      </span>
                    )}
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                    {[
                      { id: 'Cash', label: 'Cash (રોકડ)', icon: '💵', color: 'var(--revenue)', bg: 'rgba(5, 150, 105, 0.15)', activeColor: 'var(--revenue-light)' },
                      { id: 'UPI', label: 'UPI / QR', icon: '📱', color: 'var(--revenue)', bg: 'rgba(5, 150, 105, 0.15)', activeColor: 'var(--revenue-light)' },
                      { id: 'Bank Transfer', label: 'Bank (બેંક)', icon: '🏦', color: 'var(--revenue)', bg: 'rgba(5, 150, 105, 0.15)', activeColor: 'var(--revenue-light)' },
                      { id: 'Udhar', label: 'Udhar (ઉધાર)', icon: '⏳', color: '#f59e0b', bg: 'rgba(217, 119, 6, 0.18)', activeColor: '#f59e0b' },
                    ].map((m) => {
                      const isSelected = rcptMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setRcptMethod(m.id);
                            if (m.id === 'Udhar' && rcptSourceType === 'other') {
                              setRcptAutoCreatePerson(true);
                            }
                          }}
                          style={{
                            padding: '0.55rem 0.25rem',
                            borderRadius: 'var(--radius-sm)',
                            background: isSelected ? m.bg : 'var(--bg-surface-elevated)',
                            border: `1px solid ${isSelected ? m.color : 'var(--border-subtle)'}`,
                            color: isSelected ? m.activeColor : 'var(--text-secondary)',
                            fontSize: '0.78rem',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.2rem',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span style={{ fontSize: '1.1rem' }}>{m.icon}</span>
                          <span style={{ whiteSpace: 'nowrap' }}>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Udhar Context & Warning Notice */}
                {rcptMethod === 'Udhar' && (
                  <div
                    style={{
                      background: 'rgba(217, 119, 6, 0.1)',
                      border: '1px solid rgba(217, 119, 6, 0.35)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '0.65rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-main)',
                    }}
                  >
                    <span style={{ fontSize: '1.25rem', color: '#f59e0b' }}>⚠️</span>
                    <div>
                      <strong style={{ display: 'block', color: '#f59e0b', marginBottom: '2px' }}>
                        Citizen Khata Credit (ઉધાર ખાતામાં બાકી રકમ તરીકે નોંધાશે)
                      </strong>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                        This will increase the citizen's pending balance in their village ledger. Today's cash box will not be increased until payment is settled.
                      </span>
                    </div>
                  </div>
                )}

                {/* Udhar Purpose Presets */}
                {rcptMethod === 'Udhar' && (
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>
                      Udhar Service / Reason (ઉધારનું કારણ):
                    </label>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {UDHAR_PRESETS.map((p) => {
                        const isSelected = rcptNotes === p.notes;
                        return (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => setRcptNotes(p.notes)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.25rem 0.5rem',
                              borderRadius: 'var(--radius-xs)',
                              fontSize: '0.725rem',
                              fontWeight: isSelected ? 700 : 500,
                              background: isSelected ? 'rgba(217, 119, 6, 0.2)' : 'var(--bg-surface-elevated)',
                              border: `1px solid ${isSelected ? '#f59e0b' : 'var(--border-subtle)'}`,
                              color: isSelected ? '#f59e0b' : 'var(--text-secondary)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span>{p.icon}</span>
                            <span>{p.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Transaction Reference (if UPI or Bank) */}
                {rcptMethod !== 'Cash' && rcptMethod !== 'Udhar' && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.785rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                      Reference / UTR / Transaction No. (ઓપ્શનલ)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. UPI Ref / UTR / Cheque No."
                      value={rcptRef}
                      onChange={(e) => setRcptRef(e.target.value)}
                    />
                  </div>
                )}

                {/* Details / Purpose */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.785rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                    Details / Purpose (વિગત / હેતુ)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 7/12 Land record fee, 5 Xerox copies, Form submission..."
                    value={rcptNotes}
                    onChange={(e) => setRcptNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', padding: '0.85rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setIsReceiptModalOpen(false);
                    resetReceiptForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    fontWeight: 700,
                    minWidth: '140px',
                    background: rcptMethod === 'Udhar' ? '#d97706' : undefined,
                    borderColor: rcptMethod === 'Udhar' ? '#d97706' : undefined,
                  }}
                  disabled={createReceiptMutation.isPending}
                >
                  {createReceiptMutation.isPending
                    ? 'Recording...'
                    : rcptMethod === 'Udhar'
                    ? 'Save Udhar (ઉધાર નોંધો)'
                    : 'Save Receipt (આવક)'}
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
