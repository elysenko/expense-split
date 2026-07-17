import React from 'react';

export default function EmptyState({
  icon = '📭',
  title,
  message,
  action,
  testId,
}: {
  icon?: string;
  title: string;
  message?: string;
  action?: React.ReactNode;
  testId?: string;
}) {
  return (
    <div className="empty" data-testid={testId}>
      <div className="ico" aria-hidden>{icon}</div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}
