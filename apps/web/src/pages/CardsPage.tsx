import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Doodles } from '../components/Doodles';
import { useAuth } from '../state/AuthContext';
import { haptic } from '../telegram/webapp';

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
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void api<Category[]>('/cards/categories').then(setCategories).catch((e) => setError(e.message));
  }, []);

  async function draw() {
    setBusy(true);
    setError(null);
    try {
      const c = await api<Card>(`/cards/draw?category=${category}`);
      setCard(c);
      haptic('light');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function loadFavorites() {
    const rows = await api<Card[]>('/cards/favorites');
    setFavorites(rows);
  }

  async function loadIncoming() {
    const rows = await api<Array<{ id: string; card: Card; fromUser: { displayName: string } }>>(
      '/cards/incoming',
    );
    setIncoming(rows);
  }

  useEffect(() => {
    if (tab === 'favorites') void loadFavorites().catch((e) => setError(e.message));
    if (tab === 'incoming') void loadIncoming().catch((e) => setError(e.message));
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
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell screen" style={{ overflow: 'hidden' }}>
      <Doodles scene="default" />
      <div style={{ position: 'relative', zIndex: 1 }}>
      <p className="eyebrow">карточки</p>
      <h1 className="h2">Вытянуть мысль</h1>
      <p className="lead-hand">вопросы и идеи — без правильных ответов</p>

      <div className="section row" style={{ flexWrap: 'wrap' }}>
        <button className={`chip ${tab === 'draw' ? 'active' : ''}`} onClick={() => setTab('draw')}>
          Вытянуть
        </button>
        <button
          className={`chip ${tab === 'favorites' ? 'active' : ''}`}
          onClick={() => setTab('favorites')}
        >
          Избранное
        </button>
        {me?.couple && (
          <button
            className={`chip ${tab === 'incoming' ? 'active' : ''}`}
            onClick={() => setTab('incoming')}
          >
            От партнёра
          </button>
        )}
      </div>

      {error && <div className="section error-box">{error}</div>}

      {tab === 'draw' && (
        <div className="section stack">
          <div className="stack">
            {categories.map((c) => (
              <button
                key={c.id}
                className={`choice ${category === c.id ? 'selected' : ''}`}
                onClick={() => {
                  setCategory(c.id);
                  haptic('selection');
                }}
              >
                <strong>{c.title}</strong>
                <span className="muted">{c.description}</span>
              </button>
            ))}
          </div>
          <button className="btn btn-block" disabled={busy} onClick={draw}>
            {busy ? 'Тянем…' : 'Вытянуть карточку'}
          </button>

          {card && (
            <div className={`card-face ${card.category}`}>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}>
                {categories.find((c) => c.id === card.category)?.title || card.category}
              </span>
              <p>{card.text}</p>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn btn-secondary" onClick={toggleFavorite}>
                  {card.isFavorite ? 'В избранном' : 'Сохранить'}
                </button>
                {me?.couple && (
                  <button className="btn" disabled={busy} onClick={share}>
                    Партнёру
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'favorites' && (
        <div className="section stack">
          {favorites.length === 0 ? (
            <div className="empty">Пока пусто — вытяните первую карточку.</div>
          ) : (
            favorites.map((f) => (
              <div key={f.id} className="panel">
                <span className="badge">{f.category}</span>
                <p style={{ margin: '10px 0 0' }}>{f.text}</p>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'incoming' && (
        <div className="section stack">
          {incoming.length === 0 ? (
            <div className="empty">Партнёр ещё не отправлял карточки.</div>
          ) : (
            incoming.map((item) => (
              <div key={item.id} className="panel">
                <span className="muted">От {item.fromUser.displayName}</span>
                <p style={{ margin: '8px 0 0' }}>{item.card.text}</p>
              </div>
            ))
          )}
        </div>
      )}
      </div>
    </div>
  );
}
