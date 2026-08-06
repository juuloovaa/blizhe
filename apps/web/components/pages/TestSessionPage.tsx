'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { toastError } from '@/lib/toast';
import { haptic } from '@/lib/telegram';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { Avatar } from '@/components/Avatar';
import { Mascot } from '@/components/Mascot';
import { Screen } from '@/components/Screen';

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
  const search = useSearchParams();
  const id = search.get('id') || '';
  const [session, setSession] = useState<Session | null>(null);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  useTelegramBackButton(true, '/tests');

  const load = useCallback(async () => {
    if (!id) return;
    const data = await api<Session>(`/tests/sessions/${id}`);
    setSession(data);
    const answered = data.myAnswers.length;
    setIndex(Math.min(answered, Math.max(data.test.questions.length - 1, 0)));
  }, [id]);

  useEffect(() => {
    if (!id) {
      toastError('сессия не найдена');
      return;
    }
    void load().catch((e) => toastError(e.message));
  }, [id, load]);

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
      toastError((e as Error).message);
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
      toastError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!session) {
    return (
      <div className="app-shell app-shell-plain">
        <p className="copy">открываем тест…</p>
      </div>
    );
  }

  if (session.result) {
    const matchCount = session.result.matches?.filter((m) => m.same).length;
    const total = session.result.matches?.length;
    return (
      <Screen plain gradient>
        <p className="eyebrow">ваш результат</p>
        <p className="h-lg" style={{ marginTop: 8 }}>
          {session.test.title}
        </p>
        <div className="section result">
          {typeof matchCount === 'number' && total ? (
            <>
              <div className="eyebrow">совпадений</div>
              <div className="match">
                {matchCount} из {total}
              </div>
            </>
          ) : null}
          <p style={{ fontSize: 13, margin: '8px 0 0', lineHeight: 1.35 }}>{session.result.summary}</p>
        </div>

        {session.result.discussionQuestions?.length > 0 && (
          <section className="section card">
            <b style={{ fontSize: 13 }}>Попробуйте обсудить</b>
            {session.result.discussionQuestions.map((q) => (
              <p key={q} className="copy" style={{ marginTop: 6 }}>
                «{q}»
              </p>
            ))}
          </section>
        )}

        {session.result.recommendations?.length > 0 && (
          <section className="section card">
            <b style={{ fontSize: 13 }}>Мягкая идея</b>
            {session.result.recommendations.map((q) => (
              <p key={q} className="copy" style={{ marginTop: 6 }}>
                {q}
              </p>
            ))}
          </section>
        )}
      </Screen>
    );
  }

  const allAnswered = session.myAnswers.length >= session.test.questions.length;

  if (allAnswered && (session.status === 'waiting_partner' || session.partnerWaiting)) {
    return (
      <Screen plain className="text-center">
        <Mascot className="mb-2" />
        <p className="h-lg">
          Свою часть
          <br />
          вы завершили
        </p>
        <div className="section card">
          <div className="row" style={{ justifyContent: 'center' }}>
            {session.participants.slice(0, 2).map((p) => (
              <Avatar key={p.userId} name={p.displayName} size={40} />
            ))}
          </div>
          <p className="copy" style={{ marginTop: 9 }}>
            Ждём партнёра. Результаты откроются одновременно — чтобы было честно и спокойно.
          </p>
        </div>
        <p className="copy">Можно закрыть экран: мы напомним, когда всё будет готово.</p>
        <div className="section">
          <Link className="btn btn-ghost btn-block" href="/tests">
            К тестам
          </Link>
        </div>
      </Screen>
    );
  }

  return (
    <Screen plain gradient>
      <div className="row space-between" style={{ fontSize: 12, fontWeight: 800 }}>
        <button className="tiny-cta" onClick={() => setIndex((v) => Math.max(0, v - 1))} disabled={index === 0}>
          ← Назад
        </button>
        <span>
          {Math.min(index + 1, session.test.questions.length)} / {session.test.questions.length}
        </span>
      </div>
      <div className="progress" style={{ marginTop: 8 }}>
        <span style={{ width: `${progress}%` }} />
      </div>

      {question && !allAnswered && (
        <section className="section stack">
          <p className="eyebrow" style={{ marginTop: 8 }}>
            {session.test.title}
          </p>
          <p className="h-md">{question.text}</p>
          {question.options.map((opt) => (
            <button
              key={opt.id}
              className={`option ${answersMap.get(question.id) === opt.id ? 'selected' : ''}`}
              disabled={busy}
              onClick={() => choose(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </section>
      )}

      {allAnswered && (
        <section className="section stack">
          <div className="card">
            <p style={{ margin: 0 }}>
              Вы ответили на все вопросы.
              {session.partnerWaiting ? ' После завершения можно дождаться партнёра.' : ''}
            </p>
          </div>
          <button className="btn btn-block" disabled={busy} onClick={complete}>
            {busy ? 'Сохраняем…' : 'Завершить свою часть'}
          </button>
        </section>
      )}
    </Screen>
  );
}
