import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Avatar } from '../components/Avatar';
import { Doodles } from '../components/Doodles';
import { useAuth } from '../state/AuthContext';
import { haptic } from '../telegram/webapp';

type Preview = {
  code: string;
  inviter: { id: string; displayName: string; photoUrl?: string | null };
  expiresAt: string;
};

export function InviteConfirmPage({ code }: { code: string }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { refresh } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    void api<Preview>(`/couple/invite/${code}`)
      .then(setPreview)
      .catch((e) => setError(e.message));
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
      navigate('/');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell screen" style={{ overflow: 'hidden' }}>
      <Doodles scene="onboarding" />
      <div style={{ position: 'relative', zIndex: 1 }}>
      <p className="eyebrow">приглашение</p>
      <h1 className="brand">
        Бли<span>же</span>
      </h1>
      <p className="lead-hand">можно соединиться — и так же спокойно отключиться позже</p>

      {error && <div className="section error-box">{error}</div>}

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
          <button className="btn btn-ghost btn-block" onClick={() => navigate('/')}>
            Не сейчас
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
