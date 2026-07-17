import React, { Suspense } from 'react';
import Dashboard from '@/app/components/Dashboard';

export default async function HouseholdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="card"><div className="empty">Loading…</div></div>}>
      <Dashboard householdId={id} />
    </Suspense>
  );
}
