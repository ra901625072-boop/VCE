import React from 'react';
import { formatINR } from '../../api/client';

export interface StatCardProps {
  title: string;
  value: number; // in paise
  subtext?: string;
  icon?: React.ReactNode;
  tone?: 'revenue' | 'expense' | 'pending' | 'accent' | 'neutral';
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon,
  tone = 'neutral',
  loading = false,
}) => {
  const toneColor = {
    revenue: 'var(--revenue-light)',
    expense: 'var(--expense-light)',
    pending: 'var(--pending-light)',
    accent: 'var(--accent-light)',
    neutral: 'var(--text-main)',
  }[tone];

  const toneBorder = {
    revenue: 'rgba(5, 150, 105, 0.25)',
    expense: 'rgba(220, 38, 38, 0.25)',
    pending: 'rgba(217, 119, 6, 0.25)',
    accent: 'rgba(194, 65, 12, 0.25)',
    neutral: 'var(--border-subtle)',
  }[tone];

  return (
    <div
      className="metric-card"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: `1px solid ${toneBorder}`,
        borderRadius: 'var(--radius-md, 6px)',
        padding: '1.15rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform 0.15s ease, border-color 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </span>
        {icon && <div style={{ color: toneColor, opacity: 0.85 }}>{icon}</div>}
      </div>

      <div style={{ marginBottom: '0.35rem' }}>
        {loading ? (
          <div style={{ height: '2rem', width: '60%', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
        ) : (
          <div
            className="font-tabular"
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: toneColor,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            {formatINR(value)}
          </div>
        )}
      </div>

      {subtext && (
        <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
          {subtext}
        </div>
      )}
    </div>
  );
};
