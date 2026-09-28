import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rounded' | 'circular' | 'card';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Base Accessible Skeleton Primitive
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  variant = 'rounded',
  className = '',
  style,
  ...rest
}) => {
  const borderRadius =
    variant === 'circular'
      ? '50%'
      : variant === 'text'
      ? 'var(--radius-xs, 3px)'
      : variant === 'card'
      ? 'var(--radius-md, 6px)'
      : 'var(--radius-sm, 4px)';

  return (
    <div
      className={`skeleton-shimmer ${className}`}
      aria-hidden="true"
      style={{
        width: width ?? '100%',
        height: height ?? (variant === 'text' ? '1rem' : '100%'),
        borderRadius,
        flexShrink: 0,
        ...style,
      }}
      {...rest}
    />
  );
};

/**
 * Multi-Line Paragraph / Typography Skeleton
 */
export const SkeletonText: React.FC<{
  lines?: number;
  gap?: string | number;
  height?: string | number;
  className?: string;
}> = ({ lines = 3, gap = '0.5rem', height = '0.85rem', className = '' }) => {
  return (
    <div
      className={`skeleton-text-group ${className}`}
      style={{ display: 'flex', flexDirection: 'column', gap, width: '100%' }}
      aria-hidden="true"
    >
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={height}
          width={i === lines - 1 && lines > 1 ? '68%' : '100%'}
        />
      ))}
    </div>
  );
};

/**
 * Metric / Stat Card Wireframe Skeleton
 */
export const SkeletonStatCard: React.FC<{
  hasSubtext?: boolean;
  className?: string;
}> = ({ hasSubtext = true, className = '' }) => {
  return (
    <div
      className={`stat-card skeleton-card ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md, 6px)',
        padding: '1.15rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '115px',
      }}
      aria-hidden="true"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
        <Skeleton width="45%" height="0.8rem" variant="text" />
        <Skeleton width="28%" height="1.1rem" variant="rounded" style={{ borderRadius: 'var(--radius-full, 9999px)' }} />
      </div>
      <div style={{ margin: '0.2rem 0' }}>
        <Skeleton width="60%" height="1.85rem" variant="rounded" />
      </div>
      {hasSubtext && (
        <div style={{ marginTop: '0.45rem' }}>
          <Skeleton width="75%" height="0.7rem" variant="text" />
        </div>
      )}
    </div>
  );
};

/**
 * Data Table Wireframe Skeleton
 */
export const SkeletonTable: React.FC<{
  columns: number;
  rows?: number;
  columnWidths?: (string | undefined)[];
}> = ({ columns, rows = 6, columnWidths = [] }) => {
  return (
    <div className="table-responsive" aria-hidden="true">
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, cIdx) => (
              <th
                key={cIdx}
                style={{
                  width: columnWidths[cIdx] || undefined,
                  padding: '0.75rem 0.85rem',
                }}
              >
                <Skeleton height="0.8rem" width={`${Math.floor(55 + (cIdx % 4) * 12)}%`} variant="text" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rIdx) => (
            <tr key={rIdx}>
              {Array.from({ length: columns }).map((_, cIdx) => (
                <td key={cIdx} style={{ padding: '0.85rem' }}>
                  <Skeleton
                    height="0.95rem"
                    width={cIdx === 0 ? '45%' : cIdx === columns - 1 ? '70%' : `${Math.floor(65 + ((rIdx + cIdx) % 4) * 10)}%`}
                    variant="rounded"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Chart Wireframe Skeleton
 */
export const SkeletonChart: React.FC<{
  height?: number;
  bars?: number;
}> = ({ height = 180, bars = 7 }) => {
  const barHeights = [45, 80, 60, 95, 70, 110, 85];

  return (
    <div
      style={{
        height: `${height}px`,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        padding: '0.5rem 0.5rem 0 0.5rem',
        borderBottom: '2px solid var(--border-default)',
        gap: '0.75rem',
      }}
      aria-hidden="true"
    >
      {Array.from({ length: bars }).map((_, i) => {
        const h = barHeights[i % barHeights.length];
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.35rem',
              flex: 1,
            }}
          >
            <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
              <Skeleton width="40%" height={`${h}px`} variant="rounded" style={{ maxWidth: '28px' }} />
              <Skeleton width="40%" height={`${Math.max(15, h * 0.45)}px`} variant="rounded" style={{ maxWidth: '28px' }} />
            </div>
            <Skeleton width="60%" height="0.65rem" variant="text" style={{ marginTop: '0.4rem' }} />
          </div>
        );
      })}
    </div>
  );
};
