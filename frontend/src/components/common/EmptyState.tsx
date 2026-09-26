import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title?: string;
  gujaratiTitle?: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Records Found',
  gujaratiTitle,
  description = 'There are no entries recorded yet for this view.',
  icon = <Inbox size={38} strokeWidth={1.5} />,
  actionText,
  onAction,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        color: 'var(--text-muted)',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
          color: 'var(--text-dim)',
        }}
      >
        {icon}
      </div>

      <h4 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
        {title} {gujaratiTitle && <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({gujaratiTitle})</span>}
      </h4>

      {description && (
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.825rem', color: 'var(--text-dim)', maxWidth: '360px' }}>
          {description}
        </p>
      )}

      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
