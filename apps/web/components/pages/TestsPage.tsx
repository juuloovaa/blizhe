'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toastError } from '@/lib/toast';
import { haptic } from '@/lib/telegram';
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
  const [tab, setTab] = useState<'personal' | 'couple' | 'game'>('personal');
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

  const visible = tests.filter((t) => t.type === tab);

  return (
    <Screen gradient>
      <p className="h-lg">
        Немного
        <br />
        понять себя
      </p>

      <div className="tabs section">
        {(['personal', 'couple', 'game'] as const).map((type) => (
          <button
            key={type}
            className={tab === type ? 'on' : ''}
            onClick={() => setTab(type)}
          >
            {TYPE_LABEL[type]}
          </button>
        ))}
      </div>

      <div className="section stack">
        {visible.map((t) => (
          <div key={t.id} className="test-card">
            <h4 style={{ fontSize: 17, lineHeight: 1, margin: '0 0 5px', letterSpacing: '-0.04em' }}>
              {t.title}
            </h4>
            <p>{t.description}</p>
            <footer
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 10,
                color: 'var(--ink-soft)',
              }}
            >
              <span>{t._count.questions} вопросов</span>
              <span style={{ display: 'flex', gap: 10 }}>
                <Link className="tiny-cta" href={`/tests/intro/${t.slug}`}>
                  Подробнее
                </Link>
                <button
                  className="tiny-cta"
                  disabled={busy === t.slug}
                  onClick={() => start(t.slug)}
                >
                  {busy === t.slug ? '…' : 'Начать →'}
                </button>
              </span>
            </footer>
          </div>
        ))}
        {visible.length === 0 && <div className="empty">Пока пусто в этой группе.</div>}
      </div>
    </Screen>
  );
}
