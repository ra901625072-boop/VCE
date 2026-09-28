import React from 'react';
import { Skeleton, SkeletonStatCard, SkeletonChart, SkeletonTable } from './Skeleton';

/**
 * High-Fidelity Dashboard Page Skeleton Loader
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="dashboard-skeleton-view" aria-label="Loading dashboard analytics..." role="status">
      {/* 1. Top 4 Metric Cards */}
      <section className="metrics-grid" style={{ marginBottom: '1.35rem' }}>
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </section>

      {/* 2. Period Totals Ribbon Banner */}
      <section className="card" style={{ marginBottom: '1.35rem' }}>
        <div
          className="card-body period-totals-row"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-around',
            gap: '1rem',
            padding: '1.15rem',
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: '1 1 160px',
                borderLeft: i > 0 ? '1px solid var(--border-subtle)' : 'none',
                paddingLeft: i > 0 ? '1.25rem' : '0',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
              }}
            >
              <Skeleton width="65%" height="0.75rem" variant="text" />
              <Skeleton width="80%" height="1.4rem" variant="rounded" />
              <Skeleton width="50%" height="0.65rem" variant="text" />
            </div>
          ))}
        </div>
      </section>

      {/* 3. Charts & Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.35rem' }}>
        {/* 7-Day Trend Chart Card */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width="45%" height="1rem" variant="text" />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Skeleton width="50px" height="0.8rem" variant="text" />
              <Skeleton width="50px" height="0.8rem" variant="text" />
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: '0.75rem' }}>
            <SkeletonChart height={180} bars={7} />
          </div>
        </div>

        {/* Expenses by Category Breakdown Card */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width="45%" height="1rem" variant="text" />
            <Skeleton width="60px" height="0.8rem" variant="text" />
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1rem' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Skeleton width="40%" height="0.8rem" variant="text" />
                  <Skeleton width="25%" height="0.8rem" variant="text" />
                </div>
                <Skeleton width="100%" height="8px" variant="rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Secondary Operations Grid (Deadlines & Wallets) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.35rem' }}>
        <div className="card">
          <div className="card-header">
            <Skeleton width="50%" height="1rem" variant="text" />
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '60%' }}>
                  <Skeleton width="85%" height="0.85rem" variant="text" />
                  <Skeleton width="50%" height="0.7rem" variant="text" />
                </div>
                <Skeleton width="70px" height="1.4rem" variant="rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width="40%" height="1rem" variant="text" />
            <Skeleton width="80px" height="1.5rem" variant="rounded" />
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '50%' }}>
                  <Skeleton width="70%" height="0.85rem" variant="text" />
                  <Skeleton width="40%" height="0.7rem" variant="text" />
                </div>
                <Skeleton width="85px" height="1.25rem" variant="rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Today's Work Queue Table */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width="30%" height="1rem" variant="text" />
          <Skeleton width="90px" height="1.6rem" variant="rounded" />
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <SkeletonTable
            columns={6}
            rows={4}
            columnWidths={['120px', '200px', '180px', '130px', '110px', '100px']}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Applications / Work Page Skeleton Loader
 */
export const ApplicationsSkeleton: React.FC = () => {
  return (
    <div className="applications-skeleton-view" aria-label="Loading citizen applications..." role="status">
      {/* 1. Header with Stats & Filter Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} width="85px" height="32px" variant="rounded" />
          ))}
        </div>
        <Skeleton width="160px" height="36px" variant="rounded" />
      </div>

      {/* 2. Search & Category Filter Bar */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', padding: '0.85rem 1rem' }}>
          <Skeleton width="280px" height="34px" variant="rounded" style={{ flexGrow: 1, maxWidth: '400px' }} />
          <Skeleton width="180px" height="34px" variant="rounded" />
          <Skeleton width="140px" height="34px" variant="rounded" />
        </div>
      </div>

      {/* 3. Applications Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <SkeletonTable
            columns={9}
            rows={7}
            columnWidths={['70px', '160px', '190px', '130px', '110px', '110px', '100px', '100px', '140px']}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Citizens / People Directory Skeleton Loader
 */
export const CitizensSkeleton: React.FC = () => {
  return (
    <div className="citizens-skeleton-view" aria-label="Loading citizens directory..." role="status">
      {/* 1. Summary Metrics */}
      <section className="metrics-grid" style={{ marginBottom: '1.35rem' }}>
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </section>

      {/* 2. Search and Action Bar */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flex: 1, flexWrap: 'wrap' }}>
            <Skeleton width="280px" height="34px" variant="rounded" style={{ flexGrow: 1, maxWidth: '360px' }} />
            <Skeleton width="160px" height="34px" variant="rounded" />
          </div>
          <Skeleton width="140px" height="36px" variant="rounded" />
        </div>
      </div>

      {/* 3. Citizens Directory Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <SkeletonTable
            columns={7}
            rows={7}
            columnWidths={['70px', '180px', '130px', '140px', '110px', '120px', '130px']}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Daily Rojmel (Cash Book) Skeleton Loader
 */
export const RojmelSkeleton: React.FC = () => {
  return (
    <div className="rojmel-skeleton-view" aria-label="Loading daily rojmel ledger..." role="status">
      {/* 1. Top Controls Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Skeleton width="90px" height="0.9rem" variant="text" />
          <Skeleton width="140px" height="34px" variant="rounded" />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Skeleton width="90px" height="34px" variant="rounded" />
          <Skeleton width="140px" height="34px" variant="rounded" />
          <Skeleton width="130px" height="34px" variant="rounded" />
        </div>
      </div>

      {/* 2. Four Rojmel Stat Cards (Opening Cash, Inflows, Outflows, Closing Cash) */}
      <section className="metrics-grid" style={{ marginBottom: '1.35rem' }}>
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </section>

      {/* 3. Two-Column Ledger: Aavak (Inflow) & Javak (Outflow) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {/* Left Column: Aavak Inflows */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width="40%" height="1.1rem" variant="text" />
            <Skeleton width="25%" height="1.25rem" variant="rounded" />
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <SkeletonTable
              columns={4}
              rows={5}
              columnWidths={['65px', '160px', '75px', '95px']}
            />
          </div>
        </div>

        {/* Right Column: Javak Outflows */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width="40%" height="1.1rem" variant="text" />
            <Skeleton width="25%" height="1.25rem" variant="rounded" />
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <SkeletonTable
              columns={4}
              rows={5}
              columnWidths={['65px', '160px', '75px', '95px']}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Transactions Page Skeleton Loader
 */
export const TransactionsSkeleton: React.FC = () => {
  return (
    <div className="transactions-skeleton-view" aria-label="Loading transaction ledger..." role="status">
      {/* 1. Tabs & Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width="105px" height="34px" variant="rounded" />
          ))}
        </div>
        <Skeleton width="150px" height="36px" variant="rounded" />
      </div>

      {/* 2. Filter Bar */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', padding: '0.85rem 1rem' }}>
          <Skeleton width="260px" height="34px" variant="rounded" style={{ flexGrow: 1, maxWidth: '350px' }} />
          <Skeleton width="150px" height="34px" variant="rounded" />
          <Skeleton width="130px" height="34px" variant="rounded" />
        </div>
      </div>

      {/* 3. Summary Metric Cards */}
      <section className="metrics-grid" style={{ marginBottom: '1.35rem' }}>
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </section>

      {/* 4. Transactions Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <SkeletonTable
            columns={7}
            rows={7}
            columnWidths={['75px', '130px', '180px', '140px', '95px', '110px', '100px']}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Reports Page Skeleton Loader
 */
export const ReportsSkeleton: React.FC = () => {
  return (
    <div className="reports-skeleton-view" aria-label="Loading financial reports..." role="status">
      {/* 1. Report Selector Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width="120px" height="34px" variant="rounded" />
        ))}
      </div>

      {/* 2. Controls & Date Filter */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Skeleton width="130px" height="34px" variant="rounded" />
            <Skeleton width="120px" height="34px" variant="rounded" />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Skeleton width="90px" height="34px" variant="rounded" />
            <Skeleton width="90px" height="34px" variant="rounded" />
            <Skeleton width="85px" height="34px" variant="rounded" />
          </div>
        </div>
      </div>

      {/* 3. Metric Summary Cards */}
      <section className="metrics-grid" style={{ marginBottom: '1.35rem' }}>
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </section>

      {/* 4. Report Analytics Table */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width="35%" height="1.1rem" variant="text" />
          <Skeleton width="120px" height="1rem" variant="text" />
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <SkeletonTable
            columns={6}
            rows={6}
            columnWidths={['140px', '220px', '120px', '120px', '120px', '120px']}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Settings Page Skeleton Loader
 */
export const SettingsSkeleton: React.FC = () => {
  return (
    <div className="settings-skeleton-view" aria-label="Loading workstation configuration..." role="status">
      {/* 1. Settings Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width="140px" height="36px" variant="rounded" />
        ))}
      </div>

      {/* 2. Structured Form Card */}
      <div className="card">
        <div className="card-header">
          <Skeleton width="40%" height="1.2rem" variant="text" />
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <Skeleton width="45%" height="0.8rem" variant="text" />
                <Skeleton width="100%" height="36px" variant="rounded" />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Skeleton width="130px" height="38px" variant="rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};
