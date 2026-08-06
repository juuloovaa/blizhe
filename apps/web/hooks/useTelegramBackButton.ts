'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getWebApp } from '@/lib/telegram';

export function useTelegramBackButton(enabled = true, to?: string) {
  const router = useRouter();

  useEffect(() => {
    const wa = getWebApp();
    if (!wa || !enabled) {
      wa?.BackButton.hide();
      return;
    }

    const handler = () => {
      if (typeof to === 'string') router.push(to);
      else router.back();
    };

    wa.BackButton.show();
    wa.BackButton.onClick(handler);
    return () => {
      wa.BackButton.offClick(handler);
      wa.BackButton.hide();
    };
  }, [enabled, router, to]);
}
