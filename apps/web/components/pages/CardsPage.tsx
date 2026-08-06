'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { api } from '@/lib/api';
import { toastError, toastSuccess } from '@/lib/toast';
import { haptic } from '@/lib/telegram';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/state/AuthContext';

type Category = { id: string; title: string; description: string };
type Card = {
  id: string;
  category: string;
  text: string;
  isFavorite?: boolean;
};

export function CardsPage() {
  const { me } = useAuth();
  const [tab, setTab] = useState<'draw' | 'favorites' | 'incoming'>('draw');
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState('closeness');
  const [card, setCard] = useState<Card | null>(null);
  const [favorites, setFavorites] = useState<Card[]>([]);
  const [incoming, setIncoming] = useState<
    Array<{ id: string; card: Card; fromUser: { displayName: string } }>
  >([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void api<Category[]>('/cards/categories')
      .then(setCategories)
      .catch((e) => toastError(e.message));
  }, []);

  async function draw() {
    setBusy(true);
    try {
      const c = await api<Card>(`/cards/draw?category=${category}`);
      setCard(c);
      haptic('light');
    } catch (e) {
      toastError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (tab === 'favorites') {
      void api<Card[]>('/cards/favorites')
        .then(setFavorites)
        .catch((e) => toastError(e.message));
    }
    if (tab === 'incoming') {
      void api<Array<{ id: string; card: Card; fromUser: { displayName: string } }>>('/cards/incoming')
        .then(setIncoming)
        .catch((e) => toastError(e.message));
    }
  }, [tab]);

  async function toggleFavorite() {
    if (!card) return;
    const res = await api<{ favorited: boolean }>(`/cards/${card.id}/favorite`, { method: 'POST' });
    setCard({ ...card, isFavorite: res.favorited });
    haptic('success');
  }

  async function share() {
    if (!card) return;
    setBusy(true);
    try {
      await api(`/cards/${card.id}/share`, { method: 'POST' });
      haptic('success');
      toastSuccess('отправили партнёру');
    } catch (e) {
      toastError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen gradient={tab === 'draw' && !card}>
      <p className="h-lg">
        {tab === 'draw' && !card ? (
          <>
            Карты
            <br />
            для разговора
          </>
        ) : (
          'Карты'
        )}
      </p>

      <div className="tabs section">
            {(
          [
            ['draw', 'Вытянуть'],
            ['favorites', 'Избранное'],
            ...(me?.couple ? [['incoming', 'От партнёра'] as const] : []),
          ] as Array<[typeof tab, string]>
        ).map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? 'on' : ''}
            onClick={() => {
              setTab(id);
              if (id === 'draw') setCard(null);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'draw' && !card && (
        <div className="section stack">
          {categories.map((c) => (
            <button
              key={c.id}
              className={`choice ${category === c.id ? 'selected' : ''}`}
              onClick={() => {
                setCategory(c.id);
                haptic('selection');
              }}
            >
              {c.title}
              <small>{c.description}</small>
            </button>
          ))}
          <button className="btn btn-block dark" disabled={busy} onClick={draw} style={{ marginTop: 8 }}>
            {busy ? 'Тянем…' : 'Вытянуть карточку ✦'}
          </button>
        </div>
      )}

      {tab === 'draw' && card && (
        <div className="section stack">
          <div className="row space-between">
            <button className="tiny-cta" onClick={() => setCard(null)}>
              ←
            </button>
            <span className="badge">
              {categories.find((c) => c.id === card.category)?.title || card.category}
            </span>
            <Heart className="h-5 w-5" fill={card.isFavorite ? 'var(--hot)' : 'none'} color="var(--ink)" />
          </div>
          <div className={`card-face ${card.category}`}>
            <small className="eyebrow" style={{ color: 'var(--ink-soft)' }}>
              вытянули для вас
            </small>
            <p>{card.text}</p>
            <small style={{ fontWeight: 800 }}>Не ищите красивый ответ. Первый — уже настоящий.</small>
          </div>
          <div className="row">
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={toggleFavorite}>
              ♡ {card.isFavorite ? 'В избранном' : 'Сохранить'}
            </button>
            {me?.couple && (
              <button className="btn" style={{ flex: 1 }} disabled={busy} onClick={share}>
                Партнёру ↗
              </button>
            )}
          </div>
        </div>
      )}

      {tab === 'favorites' && (
        <div className="section stack">
          <div className="label">сохранённые</div>
          {favorites.length === 0 ? (
            <div className="empty">Пока пусто — вытяните первую карточку.</div>
          ) : (
            favorites.map((f) => (
              <div key={f.id} className="card tinted">
                <span className="chip">♡ ваша карта</span>
                <p className="question" style={{ marginTop: 9 }}>
                  {f.text}
                </p>
              </div>
            ))
          )}
          <p className="copy" style={{ textAlign: 'center' }}>
            Коллекция растёт вместе с вами.
          </p>
        </div>
      )}

      {tab === 'incoming' && (
        <div className="section stack">
          {incoming.length === 0 ? (
            <div className="empty">Партнёр ещё не отправлял карточки.</div>
          ) : (
            incoming.map((item) => (
              <div key={item.id} className="card">
                <span className="chip">от {item.fromUser.displayName}</span>
                <p className="question" style={{ marginTop: 9 }}>
                  {item.card.text}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </Screen>
  );
}
