'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toastError } from '@/lib/toast';
import { haptic } from '@/lib/telegram';
import { Avatar } from '@/components/Avatar';
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

  const name = preview?.inviter.displayName || 'Кто-то';

  return (
    <Screen gradient className="text-center">
      <p className="eyebrow">приглашение</p>
      <p className="h-lg" style={{ marginTop: 8 }}>
        {name} зовёт вас
        <br />
        быть ближе
      </p>

      {preview && (
        <div className="card pair section" style={{ textAlign: 'left', display: 'flex', gap: 10, alignItems: 'center' }}>
          <Avatar name={preview.inviter.displayName} photoUrl={preview.inviter.photoUrl} size={44} />
          <div>
            <b style={{ fontSize: 14 }}>{preview.inviter.displayName}</b>
            <p className="copy" style={{ margin: 0 }}>
              ваш будущий партнёр
            </p>
          </div>
        </div>
      )}

      <p className="copy">После подтверждения вы увидите только то, чем решите делиться.</p>

      <div className="section" style={{ marginTop: 'auto', paddingTop: 24 }}>
        <button className="btn btn-block" disabled={busy || !preview} onClick={accept}>
          {busy ? 'Соединяем…' : 'Подтвердить пару'}
        </button>
        <button
          className="btn btn-ghost btn-block"
          style={{ marginTop: 8 }}
          onClick={() => router.push('/')}
        >
          Не сейчас
        </button>
      </div>
    </Screen>
  );
}
