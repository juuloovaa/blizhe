'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toastError } from '@/lib/toast';
import { haptic } from '@/lib/telegram';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { Screen } from '@/components/Screen';

type TestDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  questions: unknown[];
};

export function TestIntroPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || '';
  const [test, setTest] = useState<TestDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  useTelegramBackButton(true, '/tests');

  useEffect(() => {
    void api<TestDetail>(`/tests/by/${slug}`)
      .then(setTest)
      .catch((e) => toastError(e.message));
  }, [slug]);

  async function start() {
    setBusy(true);
    try {
      const session = await api<{ id: string }>('/tests/start', {
        method: 'POST',
        body: JSON.stringify({ slug }),
      });
      haptic('success');
      router.push(`/tests/session?id=${session.id}`);
    } catch (e) {
      toastError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!test) {
    return (
      <div className="app-shell app-shell-plain">
        <p className="lead-hand">чуть-чуть подождите…</p>
      </div>
    );
  }

  return (
    <Screen plain>
      <p className="eyebrow">тест</p>
      <h1 className="h2">{test.title}</h1>
      <p className="lead-hand">{test.description}</p>
      <div className="section panel stack">
        <p className="muted" style={{ margin: 0 }}>
          {test.questions.length} вопросов · результат без категоричных оценок
        </p>
        <p className="muted" style={{ margin: 0 }}>
          Мы не используем формулировки вроде «вы несовместимы» и не ставим диагнозы.
        </p>
      </div>
      <div className="section">
        <button className="btn btn-block" disabled={busy} onClick={start}>
          {busy ? 'Создаём сессию…' : 'Начать тест'}
        </button>
      </div>
    </Screen>
  );
}
