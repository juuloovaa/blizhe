'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { toastError, toastSuccess } from '@/lib/toast';
import type { Me } from '@/lib/types';
import { haptic } from '@/lib/telegram';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/state/AuthContext';

export function OnboardingPage() {
  const { me, setMe } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [mode, setMode] = useState<'solo' | 'couple'>('solo');
  const [displayName, setDisplayName] = useState(me?.displayName || '');
  const [pronouns, setPronouns] = useState(me?.pronouns || '');
  const [saving, setSaving] = useState(false);

  async function finish() {
    if (saving) return;
    setSaving(true);
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
      toastSuccess('добро пожаловать');
      setMe(updated);
    } catch (e) {
      toastError((e as Error).message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  if (step === 1) {
    return (
      <Screen gradient>
        <div className="brand">
          <small>привет, это</small>
          ближе
        </div>
        <p className="h-lg" style={{ marginTop: 14 }}>
          Можно без спешки
          <br />и без правильных
          <br />
          ответов.
        </p>
        <div className="section stack">
          <button
            type="button"
            className={`choice ${mode === 'solo' ? 'selected' : ''}`}
            onClick={() => {
              setMode('solo');
              haptic('selection');
            }}
          >
            Я один / одна
            <small>хочу чуть лучше слышать себя</small>
          </button>
          <button
            type="button"
            className={`choice ${mode === 'couple' ? 'selected' : ''}`}
            onClick={() => {
              setMode('couple');
              haptic('selection');
            }}
          >
            Я в паре
            <small>хочу бережнее быть вместе</small>
          </button>
        </div>
        <div className="section" style={{ marginTop: 'auto', paddingTop: 24 }}>
          <button type="button" className="btn btn-block" onClick={() => setStep(2)}>
            Дальше
          </button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <p className="eyebrow">шаг 2 из 2</p>
      <p className="h-lg">
        Как к вам
        <br />
        обращаться?
      </p>
      <p className="copy">Это можно изменить в любой момент.</p>
      <div className="section stack">
        <div className="field">
          <label>имя</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={64}
            placeholder="Как вас зовут?"
          />
        </div>
        <div className="field">
          <label>
            местоимения <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>(опционально)</span>
          </label>
          <input
            value={pronouns}
            onChange={(e) => setPronouns(e.target.value)}
            maxLength={32}
            placeholder="она / он / они"
          />
        </div>
      </div>
      <div className="section row" style={{ marginTop: 24 }}>
        <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep(1)}>
          Назад
        </button>
        <button
          type="button"
          className="btn"
          style={{ flex: 1 }}
          disabled={saving}
          onClick={() => void finish()}
        >
          {saving ? 'Секунду…' : 'Поехали'}
        </button>
      </div>
    </Screen>
  );
}
