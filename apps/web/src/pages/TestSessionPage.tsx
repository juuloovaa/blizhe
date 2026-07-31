import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useTelegramBackButton } from '../hooks/useTelegramBackButton';
import { haptic } from '../telegram/webapp';

type Option = { id: string; label: string };
type Session = {
  id: string;
  status: string;
  test: {
    title: string;
    type: string;
    questions: Array<{ id: string; order: number; text: string; options: Option[] }>;
  };
  participants: Array<{ userId: string; displayName: string; status: string }>;
  myAnswers: Array<{ questionId: string; optionId: string }>;
  result: null | {
    summary: string;
    matches?: Array<{ question: string; same: boolean; labels: string[] }>;
    discussionQuestions: string[];
    recommendations: string[];
  };
  partnerWaiting: boolean;
};

export function TestSessionPage() {
  const { id = '' } = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  useTelegramBackButton(true, '/tests');

  const load = useCallback(async () => {
    const data = await api<Session>(`/tests/sessions/${id}`);
    setSession(data);
    const answered = data.myAnswers.length;
    setIndex(Math.min(answered, Math.max(data.test.questions.length - 1, 0)));
  }, [id]);

  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, [load]);

  const answersMap = useMemo(() => {
    const map = new Map<string, string>();
    session?.myAnswers.forEach((a) => map.set(a.questionId, a.optionId));
    return map;
  }, [session]);

  const question = session?.test.questions[index];
  const progress = session
    ? Math.round((session.myAnswers.length / session.test.questions.length) * 100)
    : 0;

  async function choose(optionId: string) {
    if (!session || !question) return;
    setBusy(true);
    try {
      await api(`/tests/sessions/${session.id}/answer`, {
        method: 'POST',
        body: JSON.stringify({ questionId: question.id, optionId }),
      });
      haptic('selection');
      await load();
      if (index < session.test.questions.length - 1) setIndex(index + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function complete() {
    if (!session) return;
    setBusy(true);
    try {
      const data = await api<Session>(`/tests/sessions/${session.id}/complete`, {
        method: 'POST',
      });
      setSession(data);
      haptic('success');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!session && !error) {
    return (
      <div className="app-shell">
        <p className="muted">Открываем тест…</p>
      </div>
    );
  }

  if (session?.result) {
    return (
      <div className="app-shell screen">
        <p className="eyebrow">Результат</p>
        <h1 className="h2">{session.test.title}</h1>
        <div className="section panel panel-accent">
          <p style={{ margin: 0, lineHeight: 1.45 }}>{session.result.summary}</p>
        </div>

        {session.result.matches && (
          <section className="section stack">
            <h2 className="h2">Совпадения и различия</h2>
            {session.result.matches.map((m, i) => (
              <div key={i} className="panel">
                <strong>{m.question}</strong>
                <p className="muted" style={{ margin: '6px 0 0' }}>
                  {m.same ? 'Совпали' : 'Различия'} · {m.labels.join(' · ')}
                </p>
              </div>
            ))}
          </section>
        )}

        <section className="section stack">
          <h2 className="h2">Вопросы для обсуждения</h2>
          {session.result.discussionQuestions.map((q) => (
            <div key={q} className="panel">
              {q}
            </div>
          ))}
        </section>

        <section className="section stack">
          <h2 className="h2">Мягкие рекомендации</h2>
          {session.result.recommendations.map((q) => (
            <div key={q} className="panel">
              {q}
            </div>
          ))}
        </section>
      </div>
    );
  }

  const allAnswered =
    !!session && session.myAnswers.length >= session.test.questions.length;

  return (
    <div className="app-shell screen">
      <p className="eyebrow">{session?.test.title}</p>
      <div className="progress">
        <span style={{ width: `${progress}%` }} />
      </div>
      <p className="muted" style={{ marginTop: 8 }}>
        Вопрос {Math.min(index + 1, session?.test.questions.length || 1)} из{' '}
        {session?.test.questions.length}
      </p>

      {error && <div className="section error-box">{error}</div>}

      {question && !allAnswered && (
        <section className="section stack">
          <h1 className="h2">{question.text}</h1>
          {(question.options as Option[]).map((opt) => (
            <button
              key={opt.id}
              className={`choice ${answersMap.get(question.id) === opt.id ? 'selected' : ''}`}
              disabled={busy}
              onClick={() => choose(opt.id)}
            >
              {opt.label}
            </button>
          ))}
          <div className="row">
            <button
              className="btn btn-ghost"
              disabled={index === 0}
              onClick={() => setIndex((v) => Math.max(0, v - 1))}
            >
              Назад
            </button>
            <button
              className="btn btn-secondary"
              disabled={index >= (session?.test.questions.length || 1) - 1}
              onClick={() => setIndex((v) => v + 1)}
            >
              Дальше
            </button>
          </div>
        </section>
      )}

      {allAnswered && (
        <section className="section stack">
          <div className="panel">
            <p style={{ margin: 0 }}>
              Вы ответили на все вопросы.
              {session?.partnerWaiting
                ? ' После завершения можно дождаться партнёра.'
                : ''}
            </p>
          </div>
          <button className="btn btn-block" disabled={busy} onClick={complete}>
            {busy ? 'Сохраняем…' : 'Завершить свою часть'}
          </button>
          {session?.status === 'waiting_partner' && (
            <p className="muted">Ждём, пока партнёр завершит тест. Результат откроется вместе.</p>
          )}
        </section>
      )}
    </div>
  );
}
