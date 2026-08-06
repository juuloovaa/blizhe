'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toastError, toastSuccess } from '@/lib/toast';
import { haptic, shareInviteLink } from '@/lib/telegram';
import type { NotificationSettings } from '@/lib/types';
import { Avatar } from '@/components/Avatar';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/state/AuthContext';

type CoupleStatus = {
  couple: null | {
    id: string;
    partner: { id: string; displayName: string; photoUrl?: string | null } | null;
  };
  pendingInvite: null | { code: string; link: string; expiresAt: string };
};

export function ProfilePage() {
  const { me, refresh, setMe } = useAuth();
  const [displayName, setDisplayName] = useState(me?.displayName || '');
  const [pronouns, setPronouns] = useState(me?.pronouns || '');
  const [couple, setCouple] = useState<CoupleStatus | null>(null);
  const [settings, setSettings] = useState<NotificationSettings | null>(
    me?.notificationSettings || null,
  );
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<'main' | 'settings'>('main');

  async function loadCouple() {
    const data = await api<CoupleStatus>('/couple');
    setCouple(data);
  }

  useEffect(() => {
    void loadCouple().catch((e) => toastError(e.message));
  }, []);

  async function saveProfile() {
    setBusy(true);
    try {
      await api('/me', {
        method: 'PATCH',
        body: JSON.stringify({ displayName, pronouns }),
      });
      await refresh();
      haptic('success');
      toastSuccess('Профиль обновлён');
    } catch (e) {
      toastError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function createInvite() {
    setBusy(true);
    try {
      const invite = await api<{ link: string; code: string }>('/couple/invite', {
        method: 'POST',
      });
      await loadCouple();
      shareInviteLink(invite.link);
      haptic('success');
    } catch (e) {
      toastError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function cancelInvite() {
    await api('/couple/invite/cancel', { method: 'POST', body: '{}' });
    await loadCouple();
    haptic('light');
  }

  async function disconnect() {
    if (!confirm('Отключиться от пары?')) return;
    await api('/couple/disconnect', { method: 'POST', body: '{}' });
    await refresh();
    await loadCouple();
  }

  async function blockPartner() {
    if (!confirm('Заблокировать партнёра и разорвать пару?')) return;
    await api('/couple/block', { method: 'POST', body: '{}' });
    await refresh();
    await loadCouple();
  }

  async function deleteCoupleData() {
    if (!confirm('Удалить общие данные пары? Оба получат уведомление.')) return;
    await api('/couple/data', { method: 'DELETE' });
    toastSuccess('Общие данные пары удалены');
  }

  async function toggleSetting(key: keyof NotificationSettings) {
    if (!settings) return;
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    await api('/me/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ [key]: next[key] }),
    });
    haptic('selection');
  }

  async function deleteAccount() {
    if (!confirm('Удалить аккаунт и все личные данные безвозвратно?')) return;
    await api('/me', { method: 'DELETE' });
    setMe(null);
    toastSuccess('Аккаунт удалён. Перезапустите приложение.');
  }

  if (!me) return null;

  if (view === 'settings') {
    return (
      <Screen>
        <div className="row" style={{ gap: 10 }}>
          <button className="tiny-cta" onClick={() => setView('main')}>
            ←
          </button>
          <p className="h-md">Настройки</p>
        </div>

        <div className="label section">уведомления</div>
        <div className="card">
          {settings &&
            (
              [
                ['dailyQuestion', 'Вопрос дня'],
                ['moodNotes', 'Ответ партнёра'],
                ['testInvites', 'Напоминание о тесте'],
                ['partnerCard', 'Новая карта'],
                ['testPartnerDone', 'Партнёр завершил тест'],
              ] as Array<[keyof NotificationSettings, string]>
            ).map(([key, label]) => (
              <div className="profile-row" key={key}>
                <span>{label}</span>
                <button
                  className={`switch ${settings[key] ? 'on' : ''}`}
                  aria-pressed={settings[key]}
                  onClick={() => toggleSetting(key)}
                />
              </div>
            ))}
        </div>

        <div className="label section">данные и приватность</div>
        <div className="card">
          <div className="profile-row">
            <span>
              Как мы храним данные
              <small>Личный чат не виден партнёру. Без геолокации и онлайн-статуса.</small>
            </span>
          </div>
          <button className="profile-row danger-text" onClick={deleteAccount} style={{ width: '100%', background: 'none', border: 0, cursor: 'pointer', textAlign: 'left' }}>
            <span>Удалить аккаунт</span>
            <b>›</b>
          </button>
        </div>
        <p className="copy" style={{ textAlign: 'center' }}>
          Ваше личное — остаётся личным.
        </p>
      </Screen>
    );
  }

  const partner = couple?.couple?.partner;

  return (
    <Screen gradient={!!partner}>
      <p className="h-lg">{partner ? `Мы с ${partner.displayName.split(' ')[0]}` : 'Профиль'}</p>

      <div className="section card pair">
        <Avatar name={me.displayName} photoUrl={me.photoUrl} size={50} />
        {partner && <Avatar name={partner.displayName} photoUrl={partner.photoUrl} size={50} />}
        <div style={{ flex: 1, marginLeft: partner ? 4 : 0 }}>
          <b>{partner ? 'Вместе' : me.displayName}</b>
          <p className="copy" style={{ margin: 0 }}>
            {partner
              ? me.displayName
              : `${me.username ? `@${me.username}` : 'telegram'}${me.pronouns ? ` · ${me.pronouns}` : ''}`}
          </p>
        </div>
      </div>

      <div className="label section">о вас</div>
      <div className="card stack">
        <div className="field">
          <label>Имя</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={64} />
        </div>
        <div className="field">
          <label>Местоимения</label>
          <input value={pronouns} onChange={(e) => setPronouns(e.target.value)} maxLength={32} />
        </div>
        <button className="tiny-cta" disabled={busy} onClick={saveProfile} style={{ alignSelf: 'flex-start' }}>
          Сохранить →
        </button>
      </div>

      <div className="label section">пара</div>
      <div className="card">
        {partner ? (
          <>
            <div className="profile-row">
              <span>
                С {partner.displayName}
                <small>вы соединены</small>
              </span>
            </div>
            <button className="profile-row" onClick={disconnect} style={{ width: '100%', background: 'none', border: 0, cursor: 'pointer', textAlign: 'left' }}>
              <span>Отключиться от пары</span>
              <b>›</b>
            </button>
            <button className="profile-row danger-text" onClick={blockPartner} style={{ width: '100%', background: 'none', border: 0, cursor: 'pointer', textAlign: 'left' }}>
              <span>Заблокировать {partner.displayName.split(' ')[0]}</span>
              <b>›</b>
            </button>
            <button className="profile-row danger-text" onClick={deleteCoupleData} style={{ width: '100%', background: 'none', border: 0, cursor: 'pointer', textAlign: 'left' }}>
              <span>
                Удалить общие данные
                <small>Оба получат уведомление</small>
              </span>
              <b>›</b>
            </button>
          </>
        ) : couple?.pendingInvite ? (
          <>
            <div className="profile-row">
              <span>
                Ссылка-приглашение
                <small style={{ wordBreak: 'break-all' }}>{couple.pendingInvite.link}</small>
              </span>
              <b>↗</b>
            </div>
            <button
              className="profile-row"
              onClick={() => shareInviteLink(couple.pendingInvite!.link)}
              style={{ width: '100%', background: 'none', border: 0, cursor: 'pointer', textAlign: 'left' }}
            >
              <span>Поделиться ссылкой</span>
              <b>›</b>
            </button>
            <button className="profile-row" onClick={cancelInvite} style={{ width: '100%', background: 'none', border: 0, cursor: 'pointer', textAlign: 'left' }}>
              <span>Отменить приглашение</span>
              <b>›</b>
            </button>
          </>
        ) : (
          <button
            className="profile-row"
            disabled={busy}
            onClick={createInvite}
            style={{ width: '100%', background: 'none', border: 0, cursor: 'pointer', textAlign: 'left' }}
          >
            <span>
              Пригласить партнёра
              <small>персональная ссылка через Telegram</small>
            </span>
            <b>›</b>
          </button>
        )}
      </div>

      <div className="label section">личное</div>
      <div className="card">
        <button className="profile-row" onClick={() => setView('settings')} style={{ width: '100%', background: 'none', border: 0, cursor: 'pointer', textAlign: 'left' }}>
          <span>Уведомления и приватность</span>
          <b>›</b>
        </button>
      </div>

      {partner && (
        <p className="copy" style={{ textAlign: 'center' }}>
          У каждой настройки есть время на отмену.
        </p>
      )}
    </Screen>
  );
}
