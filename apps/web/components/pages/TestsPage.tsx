'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toastError } from '@/lib/toast';
import { haptic } from '@/lib/telegram';
import { Doodles } from '@/components/Doodles';
import { Screen } from '@/components/Screen';

type TestItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: 'personal' | 'couple' | 'game';
  topic: string;
  _count: { questions: number };
};

const TYPE_LABEL: Record<string, string> = {
  personal: 'Личный',
  couple: 'Совместный',
  game: 'Игровой',
};

export function TestsPage() {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    void api<TestItem[]>('/tests')
      .then(setTests)
      .catch((e) => toastError(e.message));
  }, []);

  async function start(slug: string) {
    setBusy(slug);
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
      setBusy(null);
    }
  }

  const groups = {
    personal: tests.filter((t) => t.type === 'personal'),
    couple: tests.filter((t) => t.type === 'couple'),
    game: tests.filter((t) => t.type === 'game'),
  };

  return (
    <Screen>
      <Doodles scene="default" />
      <div className="relative z-[1]">
        <p className="eyebrow">тесты</p>
        <h1 className="h2">Узнать себя и друг друга</h1>
        <p className="lead-hand">без диагнозов и ярлыков — просто повод поговорить</p>

        {(['personal', 'couple', 'game'] as const).map((type) => (
          <section key={type} className="section stack">
            <h2 className="h2">{TYPE_LABEL[type]}</h2>
            {groups[type].map((t) => (
              <div key={t.id} className="list-item" style={{ cursor: 'default' }}>
                <strong>{t.title}</strong>
                <small>
                  {t.description} · {t._count.questions} вопросов
                </small>
                <div className="row" style={{ marginTop: 10 }}>
                  <button className="btn" disabled={busy === t.slug} onClick={() => start(t.slug)}>
                    {busy === t.slug ? 'Стартуем…' : 'Начать'}
                  </button>
                  <Link className="btn btn-ghost" href={`/tests/intro/${t.slug}`}>
                    Подробнее
                  </Link>
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </Screen>
  );
}
