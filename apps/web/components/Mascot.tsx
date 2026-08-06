'use client';

import { cn } from '@/lib/cn';

/** Kit mascot: hot scribble blob + eyes + smile */
export function Mascot({ className }: { className?: string }) {
  return (
    <div className={cn('mascot', className)} aria-hidden>
      <div className="scribble" />
      <div className="eyes">
        <i />
        <i />
      </div>
      <div className="smile" />
    </div>
  );
}
