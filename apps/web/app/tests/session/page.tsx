'use client';

import { Suspense } from 'react';
import { TestSessionPage } from '@/components/pages/TestSessionPage';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="app-shell app-shell-plain">
          <p className="lead-hand">открываем тест…</p>
        </div>
      }
    >
      <TestSessionPage />
    </Suspense>
  );
}
