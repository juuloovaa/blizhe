'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { Mascot } from '@/components/Mascot';
import { InviteConfirmPage } from '@/components/pages/InviteConfirmPage';
import { OnboardingPage } from '@/components/pages/OnboardingPage';
import { useAuth } from '@/state/AuthContext';

const NAV_ROUTES = ['/', '/cards', '/tests', '/assistant', '/profile'];

export function AppGate({ children }: { children: ReactNode }) {
  const { me, loading, error, inviteCode } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const showNav = NAV_ROUTES.some((r) => (r === '/' ? pathname === '/' : pathname === r));

  useEffect(() => {
    if (!loading && me && !me.onboardingCompleted && pathname !== '/onboarding') {
      router.replace('/onboarding');
    }
  }, [loading, me, pathname, router]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="relative z-[1]">
          <div className="loading-circle" />
          <h1 className="brand">ближе</h1>
          <p className="copy">место, где можно быть собой</p>
          <p className="eyebrow bottom" style={{ marginTop: 28 }}>
            загружаем немного тепла
          </p>
        </div>
      </div>
    );
  }

  if (error || !me) {
    return (
      <div className="loading-screen" style={{ background: 'var(--cream)' }}>
        <div className="relative z-[1] mx-auto max-w-[340px] text-center">
          <Mascot className="mb-3" />
          <h1 className="brand">ближе</h1>
          <div className="card tinted mt-4 text-left">
            <h2 className="h-md">Кажется, мы потерялись</h2>
            <p className="copy" style={{ marginTop: 8 }}>
              {error || 'Откройте «Ближе» через бота — так мы поймём, кто вы.'}
            </p>
          </div>
          <a
            className="btn btn-block dark bottom"
            style={{ marginTop: 16, display: 'flex' }}
            href="https://t.me/blizhee_bot"
          >
            Открыть бота
          </a>
        </div>
      </div>
    );
  }

  if (!me.onboardingCompleted) {
    return <OnboardingPage />;
  }

  if (inviteCode && !me.couple) {
    return <InviteConfirmPage code={inviteCode} />;
  }

  return (
    <>
      {children}
      {showNav ? <BottomNav /> : null}
    </>
  );
}
