'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { BottomNav } from '@/components/BottomNav';
import { Doodles } from '@/components/Doodles';
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
        <Doodles scene="onboarding" />
        <div className="relative z-[1]">
          <motion.div
            className="mascot mx-auto mb-4"
            animate={{ scale: [1, 1.05, 1], rotate: [-2, 2, -2] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            б
          </motion.div>
          <h1 className="brand">
            Бли<span>же</span>
          </h1>
          <p className="lead-hand">сейчас будет тепло…</p>
        </div>
      </div>
    );
  }

  if (error || !me) {
    return (
      <div className="loading-screen">
        <Doodles scene="default" />
        <div className="relative z-[1] max-w-[360px]">
          <h1 className="brand">
            Бли<span>же</span>
          </h1>
          <div className="section rounded-[18px] border-2 border-dashed border-danger/35 bg-danger-soft px-3.5 py-3 text-[0.92rem] text-danger">
            упс — {error || 'Не удалось авторизоваться'}
          </div>
          <p className="lead-hand">откройте приложение через бота — так спокойнее</p>
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
