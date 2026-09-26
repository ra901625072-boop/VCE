import React from 'react';
import clsx from 'clsx';

export interface BadgeProps {
  children: React.ReactNode;
  tone?: 'accent' | 'revenue' | 'expense' | 'pending' | 'info' | 'purple' | 'neutral';
  variant?: 'subtle' | 'solid';
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  tone = 'neutral',
  variant = 'subtle',
  className,
  style,
}) => {
  const toneStyles: Record<string, React.CSSProperties> = {
    accent: {
      backgroundColor: variant === 'solid' ? 'var(--accent)' : 'var(--accent-bg)',
      color: variant === 'solid' ? '#fff' : 'var(--accent-light)',
      borderColor: 'var(--accent-border)',
    },
    revenue: {
      backgroundColor: variant === 'solid' ? 'var(--revenue)' : 'var(--revenue-bg)',
      color: variant === 'solid' ? '#fff' : 'var(--revenue-light)',
      borderColor: 'var(--revenue-border)',
    },
    expense: {
      backgroundColor: variant === 'solid' ? 'var(--expense)' : 'var(--expense-bg)',
      color: variant === 'solid' ? '#fff' : 'var(--expense-light)',
      borderColor: 'var(--expense-border)',
    },
    pending: {
      backgroundColor: variant === 'solid' ? 'var(--pending)' : 'var(--pending-bg)',
      color: variant === 'solid' ? '#fff' : 'var(--pending-light)',
      borderColor: 'var(--pending-border)',
    },
    info: {
      backgroundColor: variant === 'solid' ? 'var(--info)' : 'var(--info-bg)',
      color: variant === 'solid' ? '#fff' : 'var(--info)',
      borderColor: 'var(--info-border)',
    },
    purple: {
      backgroundColor: variant === 'solid' ? 'var(--purple)' : 'var(--purple-bg)',
      color: variant === 'solid' ? '#fff' : '#c084fc',
      borderColor: 'rgba(124, 58, 237, 0.35)',
    },
    neutral: {
      backgroundColor: 'var(--bg-surface-hover)',
      color: 'var(--text-secondary)',
      borderColor: 'var(--border-default)',
    },
  };

  return (
    <span
      className={clsx('badge', className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.15rem 0.5rem',
        borderRadius: 'var(--radius-xs, 2px)',
        fontSize: '0.725rem',
        fontWeight: 600,
        border: '1px solid transparent',
        lineHeight: 1.3,
        whiteSpace: 'nowrap',
        ...toneStyles[tone],
        ...style,
      }}
    >
      {children}
    </span>
  );
};
