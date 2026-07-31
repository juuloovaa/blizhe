import { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../state/AuthContext';
import { haptic } from '../telegram/webapp';
import type { Me } from '../types';

export function OnboardingPage() {
  const { me, setMe } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [mode, setMode] = useState<'solo' | 'couple'>('solo');
  const [displayName, setDisplayName] = useState(me?.displayName || '');
  const [pronouns, setPronouns] = useState(me?.pronouns || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finish() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api<Me>('/me/onboarding', {
        method: 'POST',
        body: JSON.stringify({
          mode,
          displayName: displayName.trim() || me?.displayName || 'Пользователь',
          pronouns: pronouns.trim() || undefined,
        }),
      });
      haptic('success');
      setMe(updated);
    } catch (e) {
      const message = (e as Error).message || 'Не удалось сохранить';
      setError(message);
      console.error('onboarding failed', e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-shell screen">
      <p className="eyebrow">Добро пожаловать</p>
      <h1 className="brand">
        Бли<span>же</span>
      </h1>
      <p className="lead">
        Пространство для чувств, близости и саморефлексии — в одиночку или вместе.
      </p>

      {step === 1 ? (
        <div className="section stack">
          <h2 className="h2">Как вы здесь?</h2>
          <button
            type="button"
            className={`choice ${mode === 'solo' ? 'selected' : ''}`}
            onClick={() => {
              setMode('solo');
              haptic('selection');
            }}
          >
            <strong>Я один / одна</strong>
            <span className="muted">Личная рефлексия, тесты и помощник</span>
          </button>
          <button
            type="button"
            className={`choice ${mode === 'couple' ? 'selected' : ''}`}
            onClick={() => {
              setMode('couple');
              haptic('selection');
            }}
          >
            <strong>Я в паре</strong>
            <span className="muted">Можно пригласить партнёра по ссылке</span>
          </button>
          <button type="button" className="btn btn-block" onClick={() => setStep(2)}>
            Дальше
          </button>
        </div>
      ) : (
        <div className="section stack">
          <h2 className="h2">Как к вам обращаться?</h2>
          <div className="field">
            <label>Отображаемое имя</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={64}
              placeholder="Имя"
            />
          </div>
          <div className="field">
            <label>Местоимения (по желанию)</label>
            <input
              value={pronouns}
              onChange={(e) => setPronouns(e.target.value)}
              maxLength={32}
              placeholder="она / он / они"
            />
          </div>
          {error && <div className="error-box">{error}</div>}
          <button type="button" className="btn btn-secondary btn-block" onClick={() => setStep(1)}>
            Назад
          </button>
          <button type="button" className="btn btn-block" disabled={saving} onClick={() => void finish()}>
            {saving ? 'Сохраняем…' : 'Начать'}
          </button>
        </div>
      )}
    </div>
  );
}
