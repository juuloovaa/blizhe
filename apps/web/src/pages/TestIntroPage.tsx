import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useTelegramBackButton } from '../hooks/useTelegramBackButton';
import { haptic } from '../telegram/webapp';

type TestDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  questions: unknown[];
};

export function TestIntroPage() {
  const { slug = '' } = useParams();
  const [test, setTest] = useState<TestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  useTelegramBackButton(true, '/tests');

  useEffect(() => {
    void api<TestDetail>(`/tests/by/${slug}`)
      .then(setTest)
      .catch((e) => setError(e.message));
  }, [slug]);

  async function start() {
    setBusy(true);
    try {
      const session = await api<{ id: string }>('/tests/start', {
        method: 'POST',
        body: JSON.stringify({ slug }),
      });
      haptic('success');
      navigate(`/tests/session/${session.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!test && !error) {
    return (
      <div className="app-shell">
        <p className="lead-hand">чуть-чуть подождите…</p>
      </div>
    );
  }

  return (
    <div className="app-shell screen">
      <p className="eyebrow">тест</p>
      <h1 className="h2">{test?.title}</h1>
      <p className="lead-hand">{test?.description}</p>
      <div className="section panel stack">
        <p className="muted" style={{ margin: 0 }}>
          {test?.questions.length} вопросов · результат без категоричных оценок
        </p>
        <p className="muted" style={{ margin: 0 }}>
          Мы не используем формулировки вроде «вы несовместимы» и не ставим диагнозы.
        </p>
      </div>
      {error && <div className="section error-box">{error}</div>}
      <div className="section">
        <button className="btn btn-block" disabled={busy} onClick={start}>
          {busy ? 'Создаём сессию…' : 'Начать тест'}
        </button>
      </div>
    </div>
  );
}
