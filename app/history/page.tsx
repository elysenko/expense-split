import React, { Suspense } from 'react';
import HistoryView from '@/app/components/HistoryView';

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="card"><div className="empty">Loading…</div></div>}>
      <HistoryView />
    </Suspense>
  );
}
