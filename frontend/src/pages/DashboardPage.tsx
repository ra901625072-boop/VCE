import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardApi, vceApi, formatINR, rupeesToPaise } from '../api/client';
import { useToast } from '../context/ToastContext';
import { QuickEntryModal } from '../components/common/QuickEntryModal';

export const DashboardPage: React.FC = () => {
  const [preset, setPreset] = useState<string>('this_month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);
  const [quickEntryPrefill, setQuickEntryPrefill] = useState<string | undefined>(undefined);

  // Wallet top-up modal state
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<{ id: number; name: string } | null>(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupMethod, setTopupMethod] = useState('UPI');
  const [topupRef, setTopupRef] = useState('');

  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', preset, customStart, customEnd],
    queryFn: () => dashboardApi.get(preset, customStart || undefined, customEnd || undefined),
    refetchInterval: 30000,
  });

  const { data: walletsData } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => vceApi.getWallets(),
  });

  const topupMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWallet) throw new Error('No wallet selected');
      if (!topupAmount) throw new Error('Please enter top-up amount');
      return vceApi.topupWallet(selectedWallet.id, {
        amount: rupeesToPaise(topupAmount),
        payment_method: topupMethod,
        reference_no: topupRef,
      });
    },
    onSuccess: () => {
      toast.success('Wallet topped up successfully!');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setWalletModalOpen(false);
      setTopupAmount('');
      setTopupRef('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to top-up wallet');
    },
  });

  const m = data?.metrics || {
    today_revenue: 0,
    today_expenses: 0,
    today_profit: 0,
    today_citizen_cash: 0,
    today_citizen_upi: 0,
    total_pending_udhar: 0,
    active_applications_count: 0,
    period_revenue: 0,
    period_expenses: 0,
    period_profit: 0,
    net_commission_revenue: 0,
    panchayat_share_payable: 0,
    total_panchayat_remitted: 0,
    portal_wallets_balance: 0,
    pending_dept_claims: 0,
  };

  const rawTrend = data?.revenue_vs_expenses_trend;
  const trendPoints: { date: string; revenue: number; expenses: number }[] = Array.isArray(rawTrend)
    ? rawTrend
    : (rawTrend?.labels || []).map((label: string, i: number) => ({
        date: label,
        revenue: rawTrend?.revenue?.[i] || 0,
        expenses: rawTrend?.expenses?.[i] || 0,
      }));

  const expenseCategories = data?.expenses_by_category || [];
  const todaysWork = data?.todays_work || [];

  // Calculate max val for trend bars
  let maxTrendVal = 5000;
  trendPoints.forEach((p) => {
    if (p.revenue > maxTrendVal) maxTrendVal = p.revenue;
    if (p.expenses > maxTrendVal) maxTrendVal = p.expenses;
  });

  const openRecharge = () => {
    const list = walletsData || data?.portal_wallets || [];
    if (list.length > 0) {
      setSelectedWallet({ id: Number(list[0].id), name: list[0].portal_name });
      setWalletModalOpen(true);
    } else {
      toast.info('No portal wallets found. Please configure wallets in Settings.');
    }
  };

  return (
    <>
      {/* VCE Workstation Actions Toolbar & Date Filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
        <div className="dash-action-toolbar" style={{ margin: 0, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            id="btn-quick-new-app"
            onClick={() => {
              setQuickEntryPrefill(undefined);
              setQuickEntryOpen(true);
            }}
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>New Token (નવી અરજી)</span>
          </button>
          <button
            className="btn btn-outline"
            id="btn-quick-712"
            onClick={() => {
              setQuickEntryPrefill('AnyRoR 7/12 & 8-A Print');
              setQuickEntryOpen(true);
            }}
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>7/12 &amp; 8-A Print</span>
          </button>
          <Link to="/rojmel" className="btn btn-outline" style={{ textDecoration: 'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>Daily Rojmel (રોજમેળ)</span>
          </Link>
          <button className="btn btn-outline" id="btn-quick-recharge" onClick={openRecharge} type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            <span>Portal Wallet Top-up</span>
          </button>
        </div>

        {/* Date Filter Preset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            id="dash-preset-select"
            className="form-select"
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.8rem', fontWeight: 600 }}
          >
            <option value="this_month">This Month</option>
            <option value="this_fy">This Financial Year (FY 2026-27)</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="last_fy">Previous FY</option>
            <option value="this_year">This Calendar Year</option>
            <option value="all">All Time</option>
            <option value="custom">Custom Range</option>
          </select>
          {preset === 'custom' && (
            <div id="custom-range-inputs" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <input
                type="date"
                id="dash-date-start"
                className="form-control font-tabular"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                style={{ width: '125px', padding: '0.3rem 0.45rem', fontSize: '0.75rem' }}
              />
              <span style={{ color: 'var(--text-dim)' }}>-</span>
              <input
                type="date"
                id="dash-date-end"
                className="form-control font-tabular"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                style={{ width: '125px', padding: '0.3rem 0.45rem', fontSize: '0.75rem' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards Grid — Clean, Solid, Grounded VCE Palette */}
      <section className="metrics-grid">
        {/* Today's Citizen Revenue */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Today's Revenue</span>
            <span className="stat-pill revenue">+ Inflows (આવક)</span>
          </div>
          <span className="stat-value font-tabular" id="val-today-revenue">
            {formatINR(m.today_revenue)}
          </span>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            <span>
              Cash: <b id="sub-dash-cash" className="font-tabular" style={{ color: 'var(--text-main)' }}>{formatINR(m.today_citizen_cash)}</b>
            </span>
            <span>
              UPI: <b id="sub-dash-upi" className="font-tabular" style={{ color: 'var(--text-main)' }}>{formatINR(m.today_citizen_upi)}</b>
            </span>
          </div>
        </div>

        {/* Center Expenses Today */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Today's Expenses</span>
            <span className="stat-pill expense">- Outflows (જાવક)</span>
          </div>
          <span className="stat-value font-tabular" id="val-today-expenses">
            {formatINR(m.today_expenses)}
          </span>
          <span className="stat-subtext" id="sub-today-expenses">
            Paper, toner, broadband &amp; utilities
          </span>
        </div>

        {/* Realized Profit Today */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Today's Net Profit</span>
            <span className="stat-pill profit">Net Balance (શુદ્ધ)</span>
          </div>
          <span className="stat-value font-tabular" id="val-today-profit">
            {formatINR(m.today_profit)}
          </span>
          <span className="stat-subtext">Revenue − Center Expenses = Net</span>
        </div>

        {/* Outstanding Villager Udhar */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Citizen Udhar Balance</span>
            <span className="stat-pill pending">Khata (બાકી ઉધાર)</span>
          </div>
          <span className="stat-value font-tabular" id="val-pending-udhar">
            {formatINR(m.total_pending_udhar)}
          </span>
          <span className="stat-subtext">Total outstanding village credit</span>
        </div>
      </section>

      {/* Period Totals Banner */}
      <section className="card" style={{ marginBottom: '1.35rem' }}>
        <div
          className="card-body period-totals-row"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-around',
            gap: '1rem',
            textAlign: 'center',
            padding: '1.15rem',
          }}
        >
          <div>
            <div className="stat-label">Gross Citizen Collections</div>
            <div className="stat-value font-tabular" style={{ fontSize: '1.35rem', marginTop: '0.2rem' }} id="val-period-revenue">
              {formatINR(m.period_revenue)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Total cash &amp; UPI receipts</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '1.5rem' }}>
            <div className="stat-label">Net Commission (Sec 44ADA)</div>
            <div className="stat-value font-tabular" style={{ fontSize: '1.35rem', marginTop: '0.2rem', color: '#10b981' }} id="val-period-commission">
              {formatINR(m.net_commission_revenue)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>True VCE taxable turnover</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '1.5rem' }}>
            <div className="stat-label">Period Expenses</div>
            <div className="stat-value font-tabular" style={{ fontSize: '1.35rem', marginTop: '0.2rem' }} id="val-period-expenses">
              {formatINR(m.period_expenses)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Paper, toner, broadband</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '1.5rem' }}>
            <div className="stat-label">Net Cash Profit</div>
            <div className="stat-value font-tabular" style={{ fontSize: '1.35rem', marginTop: '0.2rem' }} id="val-period-profit">
              {formatINR(m.period_profit)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Operating surplus</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '1.5rem' }}>
            <div className="stat-label">Panchayat Share Payable</div>
            <div className="stat-value font-tabular" style={{ fontSize: '1.35rem', marginTop: '0.2rem', color: 'var(--accent)' }} id="val-panchayat-share">
              {formatINR(m.panchayat_share_payable)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }} id="sub-panchayat-remitted">
              Remitted: {formatINR(m.total_panchayat_remitted)}
            </div>
          </div>
        </div>
      </section>

      {/* Charts and Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.35rem' }}>
        {/* 7-Day Trend with Grounded Axis & Legend */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Daily Cash Movement (Last 7 Days)</h2>
            <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: '8px', height: '8px', background: 'var(--revenue)', borderRadius: '2px' }} /> Inflows (આવક)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: '8px', height: '8px', background: 'var(--expense)', borderRadius: '2px' }} /> Outflows (જાવક)
              </span>
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: '0.75rem' }}>
            <div className="chart-container" id="trend-bars-container">
              {trendPoints.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', padding: '1rem', textAlign: 'center', width: '100%' }}>No trend data available</p>
              ) : (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'space-between',
                      height: '180px',
                      gap: '0.65rem',
                      borderBottom: '2px solid var(--border-default)',
                      paddingBottom: '0.25rem',
                    }}
                    id="trend-bar-chart"
                  >
                    {trendPoints.map((p: any, idx: number) => {
                      const revH = p.revenue > 0 ? Math.max(6, Math.round((p.revenue / maxTrendVal) * 150)) : 2;
                      const expH = p.expenses > 0 ? Math.max(6, Math.round((p.expenses / maxTrendVal) * 150)) : 2;
                      const d = new Date(p.date);
                      const dateLabel = !isNaN(d.getTime())
                        ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                        : p.date.slice(5);

                      return (
                        <div
                          key={idx}
                          style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            height: '100%',
                            justifyContent: 'flex-end',
                          }}
                          title={`${dateLabel}\nInflow (આવક): ${formatINR(p.revenue)}\nOutflow (જાવક): ${formatINR(p.expenses)}`}
                        >
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '160px', width: '100%', justifyContent: 'center' }}>
                            <div
                              className="trend-bar-animated"
                              style={{
                                width: '14px',
                                maxWidth: '42%',
                                height: `${revH}px`,
                                background: 'var(--revenue)',
                                borderRadius: '2px 2px 0 0',
                              }}
                            />
                            <div
                              className="trend-bar-animated"
                              style={{
                                width: '14px',
                                maxWidth: '42%',
                                height: `${expH}px`,
                                background: 'var(--expense)',
                                borderRadius: '2px 2px 0 0',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.45rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} id="trend-bar-dates">
                    {trendPoints.map((p: any, idx: number) => {
                      const d = new Date(p.date);
                      const dateLabel = !isNaN(d.getTime())
                        ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                        : p.date.slice(5);
                      return (
                        <div key={idx} style={{ flex: 1, textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {dateLabel}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Expense by Category */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Center Expenses Breakdown</h2>
          </div>
          <div className="card-body" id="expense-breakdown-list">
            {expenseCategories.length === 0 ? (
              <div className="empty-state">
                <p className="empty-text">No expenses recorded</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {expenseCategories.map((cat: any, idx: number) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                      <span>{cat.label}</span>
                      <span className="font-tabular" style={{ fontWeight: 600 }}>
                        {formatINR(cat.amount)}{' '}
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>({cat.percentage}%)</span>
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '5px', background: 'var(--border-default)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${cat.percentage}%`,
                          height: '100%',
                          background: '#ef4444',
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Applications Table & Mobile Card List */}
      <div className="card" style={{ marginBottom: '1.35rem' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h2 className="card-title">Today's Citizen Applications</h2>
            <span id="today-work-badge" className="badge font-tabular">
              {todaysWork.length} records
            </span>
          </div>
          <Link to="/work" className="btn btn-outline btn-sm">
            View All Applications
          </Link>
        </div>

        <div className="table-container hide-on-mobile">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '130px', minWidth: '130px', whiteSpace: 'nowrap' }}>Token No.</th>
                <th style={{ minWidth: '160px' }}>Citizen Name</th>
                <th style={{ minWidth: '200px' }}>Service Details</th>
                <th style={{ width: '120px', minWidth: '120px', whiteSpace: 'nowrap' }}>Portal</th>
                <th style={{ width: '120px', minWidth: '120px', whiteSpace: 'nowrap' }}>Status</th>
                <th style={{ width: '95px', minWidth: '95px', textAlign: 'right', whiteSpace: 'nowrap' }}>Total Fee</th>
                <th style={{ width: '105px', minWidth: '105px', textAlign: 'right', whiteSpace: 'nowrap' }}>Pending</th>
              </tr>
            </thead>
            <tbody id="tbody-today-work">
              {todaysWork.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No applications recorded today
                  </td>
                </tr>
              ) : (
                todaysWork.map((w: any) => {
                  let statusClass = 'badge-waiting';
                  if (w.status === 'Ready / Printed') statusClass = 'badge-planned';
                  else if (w.status === 'Completed / Delivered' || w.status === 'Completed') statusClass = 'badge-completed';
                  else if (w.status === 'In Progress') statusClass = 'badge-in-progress';
                  else if (w.status && (w.status.includes('Cancelled') || w.status.includes('Rejected'))) statusClass = 'badge-cancelled';

                  const token = w.token_no || `TK-${w.id}`;
                  const pending = Math.max(0, (w.agreed_amount || 0) - (w.received_amount || 0));

                  return (
                    <tr key={w.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className="token-pill">{token}</span>
                      </td>
                      <td style={{ fontWeight: 600, fontFamily: 'var(--font-gujarati), var(--font-sans)' }}>
                        {w.person_name || 'Citizen'}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.835rem' }}>{w.title}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                          {w.service_category || w.category || ''}
                        </div>
                      </td>
                      <td>
                        <span className="portal-tag">{w.portal_name || 'General'}</span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className={`badge ${statusClass}`}>{w.status}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }} className="font-tabular">
                        {formatINR(w.agreed_amount)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: pending > 0 ? '#ef4444' : '#10b981', whiteSpace: 'nowrap' }} className="font-tabular">
                        {formatINR(pending)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Adaptive Feed Cards */}
        <div className="mobile-card-list show-on-mobile-only" id="mobile-today-work-list" style={{ padding: '0.75rem' }}>
          {todaysWork.map((w: any) => {
            const statusClass = `badge-${w.status.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
            const token = w.token_no || `TK-${w.id}`;
            const fee = w.agreed_amount || 0;
            const received = w.received_amount || 0;
            const pending = Math.max(0, fee - received);

            return (
              <div className="mobile-card" key={w.id}>
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

      {/* Wallet Top-up Modal (1:1 with dashboard.js modal) */}
      {walletModalOpen && (
        <div className="modal-backdrop open" id="modal-topup-wallet" onClick={() => setWalletModalOpen(false)}>
          <div className="modal-dialog" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Wallet Recharge / Top-up</h3>
              <button className="modal-close" onClick={() => setWalletModalOpen(false)} aria-label="Close" type="button">
                &times;
              </button>
            </div>
            <form
              id="wallet-topup-form"
              onSubmit={(e) => {
                e.preventDefault();
                topupMutation.mutate();
              }}
            >
              <div className="modal-body">
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f97316', marginBottom: '1rem' }}>
                  {selectedWallet?.name}
                </div>
                <div className="form-group">
                  <label className="form-label">Top-up Amount (₹) *</label>
                  <input
                    type="number"
                    id="input-topup-amt"
                    className="form-control"
                    min="1"
                    step="1"
                    placeholder="e.g. 500"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select
                    id="input-topup-method"
                    className="form-select"
                    value={topupMethod}
                    onChange={(e) => setTopupMethod(e.target.value)}
                  >
                    <option value="UPI">UPI / PhonePe / GPay</option>
                    <option value="Bank Transfer">Net Banking (IMPS/NEFT)</option>
                    <option value="Debit Card">Debit Card</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Bank Reference / UTR No.</label>
                  <input
                    type="text"
                    id="input-topup-ref"
                    className="form-control"
                    placeholder="UPI Reference No."
                    value={topupRef}
                    onChange={(e) => setTopupRef(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setWalletModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#f97316', border: 'none', fontWeight: 700 }}
                  disabled={topupMutation.isPending}
                >
                  {topupMutation.isPending ? 'Confirming...' : 'Confirm Top-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Quick Entry Modal for Token Creation */}
      <QuickEntryModal
        isOpen={quickEntryOpen}
        onClose={() => setQuickEntryOpen(false)}
        initialService={quickEntryPrefill}
      />
    </>
  );
};
export default DashboardPage;
