import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Doodles } from '../components/Doodles';
import { useAuth } from '../state/AuthContext';
import { haptic } from '../telegram/webapp';
import { MOOD_LABELS, type MoodType } from '../types';

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
  const [error, setError] = useState<string | null>(null);
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
      setError((e as Error).message);
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
      await load();
    } catch (e) {
      setError((e as Error).message);
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
      setMoodNote('');
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!data && !error) {
    return (
      <div className="app-shell">
        <p className="lead-hand">собираем ваш тихий день…</p>
      </div>
    );
  }

  return (
    <div className="app-shell screen" style={{ overflow: 'hidden' }}>
      <Doodles scene="home" />
      <div style={{ position: 'relative', zIndex: 1 }}>
      <div className="row space-between">
        <div>
          <p className="eyebrow">сегодня</p>
          <h1 className="brand" style={{ fontSize: '1.85rem' }}>
            Бли<span>же</span>
          </h1>
        </div>
        <div className={`badge ${me?.couple ? 'badge-warm' : ''}`}>
          {me?.couple ? 'вместе' : 'для себя'}
        </div>
      </div>
      <p className="lead-hand">привет, {me?.displayName}. тут можно просто быть</p>

      {error && <div className="section error-box">{error}</div>}

      {data?.soloQuestion && (
        <section className="section panel panel-accent stack">
          <div className="row space-between">
            <h2 className="h2" style={{ margin: 0 }}>
              Вопрос дня
            </h2>
            <span className="badge">Для себя</span>
          </div>
          <p style={{ margin: 0, lineHeight: 1.4 }}>{data.soloQuestion.question.text}</p>
          <div className="field">
            <textarea
              rows={3}
              value={soloText}
              onChange={(e) => setSoloText(e.target.value)}
              placeholder="Короткий ответ для себя…"
              maxLength={1000}
            />
          </div>
          <button className="btn" disabled={busy || !soloText.trim()} onClick={() => saveAnswer('solo')}>
            Сохранить ответ
          </button>
        </section>
      )}

      {data?.hasCouple && data.coupleQuestion && (
        <section className="section panel stack">
          <div className="row space-between">
            <h2 className="h2" style={{ margin: 0 }}>
              Для пары
            </h2>
            <span className="badge">Вместе</span>
          </div>
          <p style={{ margin: 0, lineHeight: 1.4 }}>{data.coupleQuestion.question.text}</p>
          {!data.coupleQuestion.revealed && (
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
                className="btn"
                disabled={busy || !coupleText.trim()}
                onClick={() => saveAnswer('couple')}
              >
                Ответить
              </button>
              {data.coupleQuestion.waitingForPartner && (
                <p className="muted">Ответ откроется, когда партнёр тоже ответит.</p>
              )}
            </>
          )}
          {data.coupleQuestion.revealed && (
            <div className="stack">
              <div className="panel">
                <strong>Вы</strong>
                <p className="muted" style={{ margin: '6px 0 0' }}>
                  {data.coupleQuestion.myAnswer?.text}
                </p>
              </div>
              <div className="panel">
                <strong>{data.coupleQuestion.partnerAnswer?.displayName}</strong>
                <p className="muted" style={{ margin: '6px 0 0' }}>
                  {data.coupleQuestion.partnerAnswer?.text}
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {!data?.hasCouple && (
        <section className="section panel stack">
          <h2 className="h2">Пригласите партнёра</h2>
          <p className="muted" style={{ margin: 0 }}>
            Совместные вопросы, заметки и тесты откроются после соединения.
          </p>
          <Link className="btn btn-block" to="/profile" style={{ textAlign: 'center', textDecoration: 'none' }}>
            Перейти к приглашению
          </Link>
        </section>
      )}

      {data?.hasCouple && (
        <section className="section stack">
          <h2 className="h2">Настроение и мысли</h2>
          {data.partnerMood && (
            <div className="panel">
              <strong>От партнёра: {MOOD_LABELS[data.partnerMood.mood]}</strong>
              {data.partnerMood.note && (
                <p className="muted" style={{ margin: '6px 0 0' }}>
                  {data.partnerMood.note}
                </p>
              )}
            </div>
          )}
          <div className="chip-grid">
            {(Object.keys(MOOD_LABELS) as MoodType[]).map((key) => (
              <button
                key={key}
                className={`chip ${mood === key ? 'active' : ''}`}
                onClick={() => {
                  setMood(key);
                  haptic('selection');
                }}
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
              placeholder="Короткая заметка партнёру (по желанию)"
              maxLength={500}
            />
          </div>
          <button className="btn" disabled={!mood || busy} onClick={sendMood}>
            Отправить партнёру
          </button>
        </section>
      )}

      <section className="section stack">
        <h2 className="h2">Тесты</h2>
        {data?.testInvites?.length ? (
          data.testInvites.map((t) => (
            <Link key={t.sessionId} className="list-item" to={`/tests/session/${t.sessionId}`}>
              <strong>{t.test.title}</strong>
              <small>
                {t.status === 'completed'
                  ? 'Результат готов'
                  : t.myStatus === 'done'
                    ? 'Ждём партнёра'
                    : 'Продолжить'}
              </small>
            </Link>
          ))
        ) : (
          <Link className="list-item" to="/tests">
            <strong>Пройти тест</strong>
            <small>Личные и совместные — без оценок и диагнозов</small>
          </Link>
        )}
      </section>
      </div>
    </div>
  );
}
