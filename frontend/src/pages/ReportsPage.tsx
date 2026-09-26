import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, vceApi, formatINR, formatDate } from '../api/client';
import { ReportData } from '../types';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('revenue');
  const [preset, setPreset] = useState('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['vce-profile'],
    queryFn: () => vceApi.getProfile(),
  });

  const { data: report, isLoading, refetch } = useQuery<ReportData>({
    queryKey: ['reports', reportType, preset, startDate, endDate],
    queryFn: () => reportsApi.get(reportType, preset, startDate, endDate),
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!report || !report.rows || report.rows.length === 0) return;
    const cols = report.columns || Object.keys(report.rows[0]);
    const headers = cols.join(',');
    const rows = report.rows.map((r) =>
      cols.map((col) => `"${String(r[col] !== undefined ? r[col] : '').replace(/"/g, '""')}"`).join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VCE_Report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const rows = report?.rows || [];
  const columns = report?.columns || (rows.length > 0 ? Object.keys(rows[0]) : []);

  return (
    <>
      {/* 1-Click Export Actions Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button
          className="btn btn-outline btn-sm"
          id="btn-export-csv"
          onClick={handleExportCSV}
          title="Export CSV"
          type="button"
          style={{ fontWeight: 600 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>CSV</span>
        </button>
        <button
          className="btn btn-outline btn-sm"
          id="btn-export-excel"
          onClick={handleExportCSV}
          title="Export Excel"
          type="button"
          style={{ fontWeight: 600 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span>Excel</span>
        </button>
        <button
          className="btn btn-outline btn-sm"
          id="btn-print-report"
          onClick={handlePrint}
          title="Print Statement (Ctrl+P)"
          type="button"
          style={{ fontWeight: 600 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          <span>Print</span>
        </button>
      </div>

      {/* Official Printable Letterhead (visible ONLY in print) */}
      <div className="print-only-header">
        <div className="print-header-top">
          <div>
            <h1 className="print-header-title">ગુજરાત સરકાર • પંચાયત, ગ્રામ ગૃહનિર્માણ અને ગ્રામ વિકાસ વિભાગ</h1>
            <div className="print-header-sub" id="print-statement-sub">
              e-Gram Vishwagram Project — Official Financial Audit Statement
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11pt', fontWeight: 800, color: '#111827' }} id="print-statement-title">
              {report?.title || 'Financial Audit Statement'}
            </div>
            <div style={{ fontSize: '8pt', color: '#4b5563' }} id="print-statement-period">
              Period: {preset}
            </div>
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

      {/* Report Configuration Controls */}
      <div className="card filter-bar-shell" style={{ marginBottom: '1.65rem' }}>
        <div
          className="card-body"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.15rem',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            padding: '1.25rem 1.65rem',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.95rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Statement Type</label>
              <select
                id="report-type-select"
                className="form-select"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                style={{ width: '280px', fontSize: '0.85rem', fontWeight: 600 }}
              >
                <option value="revenue">Revenue Statement (આવક સ્ટેટમેન્ટ)</option>
                <option value="expense">Expense Statement (ખર્ચ સ્ટેટમેન્ટ)</option>
                <option value="profit">Cash Profit &amp; Loss (P&amp;L નફો-નુકસાન)</option>
                <option value="accrual_pnl">Accrual P&amp;L (Statutory Tax Report / 44ADA)</option>
                <option value="balance_sheet">Balance Sheet (નાણાકીય સ્થિતિ / Net Worth)</option>
                <option value="dept_claims">Govt Work Orders &amp; Claims (સરકારી ક્લેમ)</option>
                <option value="panchayat_share">Gram Panchayat Revenue Share</option>
                <option value="person_wise">Citizen Ledger (નાગરિક ખાતાવહી)</option>
                <option value="work_wise">Service / Applications Report</option>
                <option value="outstanding">Outstanding Udhar Register (બાકી ઉધાર)</option>
                <option value="payment_method">Payment Methods Breakdown</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Period</label>
              <select
                id="report-preset-select"
                className="form-select"
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
                style={{ width: '210px', fontSize: '0.85rem', fontWeight: 600 }}
              >
                <option value="this_month">This Month</option>
                <option value="this_fy">This Financial Year (FY)</option>
                <option value="last_fy">Previous FY</option>
                <option value="q1_fy">Q1 FY (Apr - Jun)</option>
                <option value="q2_fy">Q2 FY (Jul - Sep)</option>
                <option value="q3_fy">Q3 FY (Oct - Dec)</option>
                <option value="q4_fy">Q4 FY (Jan - Mar)</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This Week</option>
                <option value="this_year">This Calendar Year</option>
                <option value="all">All Time</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {preset === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <input
                  type="date"
                  className="form-control font-tabular"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ width: '130px', fontSize: '0.775rem', padding: '0.4rem' }}
                />
                <span style={{ color: 'var(--text-dim)' }}>-</span>
                <input
                  type="date"
                  className="form-control font-tabular"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ width: '130px', fontSize: '0.775rem', padding: '0.4rem' }}
                />
              </div>
            )}
          </div>

          <button className="btn btn-primary" onClick={() => refetch()} type="button" style={{ fontWeight: 700 }}>
            Generate Report
          </button>
        </div>
      </div>

      {/* Report Results Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title" id="report-view-title">
            {report?.title || 'Statement Preview'}
          </h2>
          {(report as any)?.totals && (
            <span id="report-total-badge" className="badge badge-completed font-tabular" style={{ fontSize: '0.85rem', padding: '0.25rem 0.65rem' }}>
              Total: {formatINR((report as any).totals.amount || (report as any).totals.revenue || 0)}
            </span>
          )}
        </div>

        <div className="table-container hide-on-mobile">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} style={{ textTransform: 'capitalize' }}>
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length || 5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Generating statement...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length || 5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No records found for the selected period and statement type.
                  </td>
                </tr>
              ) : (
                rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {columns.map((col, cIdx) => {
                      const val = row[col];
                      const isAmount = col.includes('amount') || col.includes('fee') || col.includes('profit') || col.includes('revenue') || col.includes('expense') || col.includes('share') || col.includes('commission');

                      return (
                        <td
                          key={cIdx}
                          className={isAmount ? 'font-tabular' : ''}
                          style={{
                            textAlign: isAmount ? 'right' : 'left',
                            fontWeight: isAmount ? 600 : 'normal',
                          }}
                        >
                          {isAmount && typeof val === 'number' ? formatINR(val) : String(val !== undefined && val !== null ? val : '—')}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Dual Sign-off Block (visible ONLY in print) */}
      <div className="print-only-signatures">
        <div className="print-sig-box">
          <div className="print-sig-title">વી.સી.ઈ. ની સહી (VCE Operator)</div>
          <div className="print-sig-sub">
            Certified that this financial audit statement accurately reflects e-Gram center records.
          </div>
        </div>
        <div className="print-sig-box">
          <div className="print-sig-title">તલાટી કમ મંત્રી સહી અને સિક્કો (Talati-cum-Mantri)</div>
          <div className="print-sig-sub">
            Verified and countersigned for statutory audit &amp; Gram Panchayat records.
          </div>
        </div>
      </div>
    </>
  );
};
export default ReportsPage;
