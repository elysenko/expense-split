import React from 'react';

export default function EmptyState({
  emoji = '📭',
  title,
  subtitle,
  testid,
  action,
}: {
  emoji?: string;
  title: string;
  subtitle?: string;
  testid?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty" data-testid={testid}>
      <div className="emoji" aria-hidden>{emoji}</div>
      <h3>{title}</h3>
      {subtitle && <p className="small">{subtitle}</p>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}
