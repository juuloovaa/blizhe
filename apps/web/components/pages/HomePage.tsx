'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { toastError, toastSuccess } from '@/lib/toast';
import { haptic } from '@/lib/telegram';
import { MOOD_LABELS, type MoodType } from '@/lib/types';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/state/AuthContext';

type HomeData = {
  hasCouple: boolean;
  soloQuestion: null | {
    question: { id: string; text: string; type: string };
    myAnswer: null | { text: string };
  };
  coupleQuestion: null | {
    question: { id: string; text: string };
    myAnswer: null | { text: string };
    partnerAnswer: null | { text: string; displayName: string };
    waitingForPartner: boolean;
    revealed: boolean;
  };
  partnerMood: null | { mood: MoodType; note?: string | null; createdAt: string };
  myMood: null | { mood: MoodType; note?: string | null };
  testInvites: Array<{
    sessionId: string;
    status: string;
    test: { title: string; slug: string; type: string };
    myStatus: string | null;
  }>;
};

export function HomePage() {
  const { me } = useAuth();
  const [data, setData] = useState<HomeData | null>(null);
  const [soloText, setSoloText] = useState('');
  const [coupleText, setCoupleText] = useState('');
  const [mood, setMood] = useState<MoodType | null>(null);
  const [moodNote, setMoodNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const home = await api<HomeData>('/home');
      setData(home);
      setSoloText(home.soloQuestion?.myAnswer?.text || '');
      setCoupleText(home.coupleQuestion?.myAnswer?.text || '');
    } catch (e) {
      toastError((e as Error).message);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveAnswer(type: 'solo' | 'couple') {
    if (!data) return;
    const q = type === 'solo' ? data.soloQuestion?.question : data.coupleQuestion?.question;
    const text = type === 'solo' ? soloText : coupleText;
    if (!q || !text.trim()) return;
    setBusy(true);
    try {
      await api('/home/daily-answer', {
        method: 'POST',
        body: JSON.stringify({ questionId: q.id, answerText: text, type }),
      });
      haptic('success');
      toastSuccess('сохранили');
      await load();
    } catch (e) {
      toastError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function sendMood() {
    if (!mood) return;
    setBusy(true);
    try {
      await api('/home/mood', {
        method: 'POST',
        body: JSON.stringify({ mood, note: moodNote || undefined }),
      });
      haptic('success');
      toastSuccess('отправили партнёру');
      setMoodNote('');
      await load();
    } catch (e) {
      toastError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <div className="app-shell">
        <p className="copy">собираем ваш тихий день…</p>
      </div>
    );
  }

  const weekday = new Date().toLocaleDateString('ru-RU', { weekday: 'long' });

  return (
    <Screen gradient={!data.hasCouple}>
      <div className="row space-between" style={{ alignItems: 'flex-start' }}>
        <div>
          <p className="eyebrow">сегодня · {weekday}</p>
          <h1 className="brand brand-sm">ближе</h1>
        </div>
        <span className={`badge ${me?.couple ? 'badge-warm' : ''}`}>
          {me?.couple ? 'вместе' : 'для себя'}
        </span>
      </div>

      <p className="h-md" style={{ marginTop: 10 }}>
        Привет, {me?.displayName}.
        <br />
        Как вы сейчас?
      </p>

      {data.soloQuestion && (
        <section className="section card stack">
          <div className="eyebrow">вопрос дня</div>
          <p className="question">{data.soloQuestion.question.text}</p>
          <div className="field">
            <textarea
              rows={3}
              value={soloText}
              onChange={(e) => setSoloText(e.target.value)}
              placeholder="Можно писать как получится…"
              maxLength={1000}
            />
          </div>
          <button
            className="tiny-cta"
            disabled={busy || !soloText.trim()}
            onClick={() => saveAnswer('solo')}
            style={{ alignSelf: 'flex-start' }}
          >
            Сохранить →
          </button>
        </section>
      )}

      {data.hasCouple && data.coupleQuestion && (
        <section className="section card tinted stack">
          <div className="eyebrow">вопрос для пары</div>
          <p className="question">{data.coupleQuestion.question.text}</p>
          {!data.coupleQuestion.revealed && (
            <>
              {data.coupleQuestion.myAnswer ? (
                <div className="bubble">
                  <b>Ваш ответ сохранён</b>
                  <br />
                  <span className="copy" style={{ margin: 0 }}>
                    {data.coupleQuestion.waitingForPartner
                      ? 'Ждём ответ партнёра, чтобы открыть оба.'
                      : data.coupleQuestion.myAnswer.text}
                  </span>
                </div>
              ) : (
                <>
                  <div className="field">
                    <textarea
                      rows={3}
                      value={coupleText}
                      onChange={(e) => setCoupleText(e.target.value)}
                      placeholder="Ваш ответ — партнёр увидит после взаимности"
                      maxLength={1000}
                    />
                  </div>
                  <button
                    className="tiny-cta"
                    disabled={busy || !coupleText.trim()}
                    onClick={() => saveAnswer('couple')}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    Ответить →
                  </button>
                </>
              )}
            </>
          )}
          {data.coupleQuestion.revealed && (
            <div className="stack">
              <div className="bubble">
                <b>Вы</b>
                <br />
                {data.coupleQuestion.myAnswer?.text}
              </div>
              <div className="bubble user" style={{ marginLeft: 0, alignSelf: 'stretch' }}>
                <b>{data.coupleQuestion.partnerAnswer?.displayName}</b>
                <br />
                {data.coupleQuestion.partnerAnswer?.text}
              </div>
            </div>
          )}
        </section>
      )}

      {!data.hasCouple && (
        <section className="section card tinted">
          <b style={{ fontSize: 13 }}>Хотите позвать близкого?</b>
          <p className="copy" style={{ margin: '4px 0' }}>
            Некоторые вопросы можно проходить вдвоём.
          </p>
          <Link className="tiny-cta" href="/profile">
            Пригласить партнёра
          </Link>
        </section>
      )}

      {data.hasCouple && (
        <section className="section stack">
          <div className="label">настроение для партнёра</div>
          {data.partnerMood && (
            <div className="card">
              <strong>От партнёра: {MOOD_LABELS[data.partnerMood.mood]}</strong>
              {data.partnerMood.note && (
                <p className="muted" style={{ margin: '6px 0 0' }}>
                  {data.partnerMood.note}
                </p>
              )}
            </div>
          )}
          <div className="moods">
            {(Object.keys(MOOD_LABELS) as MoodType[]).map((key) => (
              <button
                key={key}
                className={`mood ${mood === key ? 'on' : ''}`}
                onClick={() => {
                  setMood(key);
                  haptic('selection');
                }}
                title={MOOD_LABELS[key]}
              >
                {MOOD_LABELS[key]}
              </button>
            ))}
          </div>
          <div className="field">
            <textarea
              rows={2}
              value={moodNote}
              onChange={(e) => setMoodNote(e.target.value)}
              placeholder="Если хочется — добавьте пару слов"
              maxLength={500}
            />
          </div>
          <button className="btn" disabled={!mood || busy} onClick={sendMood}>
            Отправить партнёру
          </button>
        </section>
      )}

      <section className="section card">
        <b style={{ fontSize: 13 }}>Маленькая практика</b>
        {data.testInvites?.length ? (
          data.testInvites.map((t) => (
            <Link
              key={t.sessionId}
              className="row"
              href={`/tests/session?id=${t.sessionId}`}
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop: '1px solid var(--line)',
                textDecoration: 'none',
                color: 'inherit',
                fontSize: 12,
              }}
            >
              <span
                style={{
                  width: 29,
                  height: 29,
                  borderRadius: 10,
                  background: 'var(--lilac)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                ✦
              </span>
              <span style={{ flex: 1 }}>
                {t.test.title}
                <br />
                <small style={{ color: 'var(--ink-soft)' }}>
                  {t.status === 'completed'
                    ? 'Результат готов'
                    : t.myStatus === 'done'
                      ? 'Ждём партнёра'
                      : 'Продолжить'}
                </small>
              </span>
              <b>→</b>
            </Link>
          ))
        ) : (
          <Link
            className="row"
            href="/tests"
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1px solid var(--line)',
              textDecoration: 'none',
              color: 'inherit',
              fontSize: 12,
            }}
          >
            <span
              style={{
                width: 29,
                height: 29,
                borderRadius: 10,
                background: 'var(--lilac)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              ✦
            </span>
            <span style={{ flex: 1 }}>
              Пройти тест
              <br />
              <small style={{ color: 'var(--ink-soft)' }}>без оценок и диагнозов</small>
            </span>
            <b>→</b>
          </Link>
        )}
      </section>
    </Screen>
  );
}
