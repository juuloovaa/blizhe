'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { toastError, toastSuccess } from '@/lib/toast';
import type { Me } from '@/lib/types';
import { haptic } from '@/lib/telegram';
import { Doodles } from '@/components/Doodles';
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

  return (
    <Screen>
      <Doodles scene="onboarding" />
      <div className="relative z-[1]">
        <p className="eyebrow">привет, это</p>
        <h1 className="brand">
          Бли<span>же</span>
        </h1>
        <p className="lead-hand">можно без спешки и без правильных ответов</p>

        {step === 1 ? (
          <div className="section stack">
            <h2 className="h2">Как вы здесь?</h2>
            <p className="soft-note">выберите то, что ближе сейчас — потом можно поменять</p>
            <button
              type="button"
              className={`choice ${mode === 'solo' ? 'selected' : ''}`}
              onClick={() => {
                setMode('solo');
                haptic('selection');
              }}
            >
              <strong>Я один / одна</strong>
              <span className="muted">Для себя: мысли, тесты и тёплый помощник</span>
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
            <p className="soft-note">как в тёплом чатике, без анкеты</p>
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
              <label>местоимения — по желанию</label>
              <input
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                maxLength={32}
                placeholder="она / он / они"
              />
            </div>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => setStep(1)}>
              Назад
            </button>
            <button
              type="button"
              className="btn btn-block"
              disabled={saving}
              onClick={() => void finish()}
            >
              {saving ? 'Секунду…' : 'Поехали'}
            </button>
          </div>
        )}
      </div>
    </Screen>
  );
}
