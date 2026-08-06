'use client';

import { Toaster } from 'sonner';
import { AppGate } from '@/components/AppGate';
import { AuthProvider } from '@/state/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppGate>{children}</AppGate>
      <Toaster position="top-center" richColors={false} closeButton />
    </AuthProvider>
  );
}
