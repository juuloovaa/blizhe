'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toastError } from '@/lib/toast';
import { haptic } from '@/lib/telegram';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { Mascot } from '@/components/Mascot';
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
        <p className="copy">чуть-чуть подождите…</p>
      </div>
    );
  }

  const typeLabel =
    test.type === 'couple' ? 'совместный' : test.type === 'game' ? 'игровой' : 'личный';

  return (
    <Screen plain>
      <p className="eyebrow">
        {typeLabel} тест · {test.questions.length} вопросов
      </p>
      <p className="h-lg" style={{ marginTop: 8 }}>
        {test.title}
      </p>
      <div className="section card tinted">
        <p className="copy" style={{ fontSize: 14, color: 'var(--ink)', margin: 0 }}>
          {test.description ||
            'Здесь нет правильных профилей. Только несколько вопросов, чтобы услышать себя чуть яснее.'}
        </p>
      </div>
      <Mascot className="my-4" />
      <p className="copy" style={{ textAlign: 'center' }}>
        Это не диагностика и не совет врача.
      </p>
      <div className="section" style={{ marginTop: 'auto', paddingTop: 16 }}>
        <button className="btn btn-block" disabled={busy} onClick={start}>
          {busy ? 'Создаём сессию…' : 'Начать тест'}
        </button>
      </div>
    </Screen>
  );
}
