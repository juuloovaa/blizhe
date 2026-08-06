'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toastError } from '@/lib/toast';
import { haptic } from '@/lib/telegram';
import { Avatar } from '@/components/Avatar';
import { Doodles } from '@/components/Doodles';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/state/AuthContext';

type Preview = {
  code: string;
  inviter: { id: string; displayName: string; photoUrl?: string | null };
  expiresAt: string;
};

export function InviteConfirmPage({ code }: { code: string }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const { refresh } = useAuth();
  const router = useRouter();

  useEffect(() => {
    void api<Preview>(`/couple/invite/${code}`)
      .then(setPreview)
      .catch((e) => toastError(e.message));
  }, [code]);

  async function accept() {
    setBusy(true);
    try {
      await api('/couple/invite/accept', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      haptic('success');
      await refresh();
      router.push('/');
    } catch (e) {
      toastError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Doodles scene="onboarding" />
      <div className="relative z-[1]">
        <p className="eyebrow">приглашение</p>
        <h1 className="brand">
          Бли<span>же</span>
        </h1>
        <p className="lead-hand">можно соединиться — и так же спокойно отключиться позже</p>

        {preview && (
          <div className="section panel stack">
            <div className="row">
              <Avatar name={preview.inviter.displayName} photoUrl={preview.inviter.photoUrl} size={56} />
              <div>
                <strong>{preview.inviter.displayName}</strong>
                <div className="muted">приглашает вас в пару</div>
              </div>
            </div>
            <button className="btn btn-block" disabled={busy} onClick={accept}>
              {busy ? 'Соединяем…' : 'Подтвердить пару'}
            </button>
            <button className="btn btn-ghost btn-block" onClick={() => router.push('/')}>
              Не сейчас
            </button>
          </div>
        )}
      </div>
    </Screen>
  );
}
