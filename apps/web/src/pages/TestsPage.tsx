import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { haptic } from '../telegram/webapp';

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
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    void api<TestItem[]>('/tests')
      .then(setTests)
      .catch((e) => setError(e.message));
  }, []);

  async function start(slug: string) {
    setBusy(slug);
    setError(null);
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
      setBusy(null);
    }
  }

  const groups = {
    personal: tests.filter((t) => t.type === 'personal'),
    couple: tests.filter((t) => t.type === 'couple'),
    game: tests.filter((t) => t.type === 'game'),
  };

  return (
    <div className="app-shell screen">
      <p className="eyebrow">Тесты</p>
      <h1 className="h2">Узнать себя и друг друга</h1>
      <p className="lead">Без диагнозов и ярлыков — только материал для спокойного разговора.</p>

      {error && <div className="section error-box">{error}</div>}

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
                <button
                  className="btn"
                  disabled={busy === t.slug}
                  onClick={() => start(t.slug)}
                >
                  {busy === t.slug ? 'Стартуем…' : 'Начать'}
                </button>
                <Link className="btn btn-ghost" to={`/tests/intro/${t.slug}`}>
                  Подробнее
                </Link>
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
