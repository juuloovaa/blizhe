import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Avatar } from '../components/Avatar';
import { Doodles } from '../components/Doodles';
import { useAuth } from '../state/AuthContext';
import { haptic, shareInviteLink } from '../telegram/webapp';
import type { NotificationSettings } from '../types';

type CoupleStatus = {
  couple: null | { id: string; partner: { id: string; displayName: string; photoUrl?: string | null } | null };
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
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadCouple() {
    const data = await api<CoupleStatus>('/couple');
    setCouple(data);
  }

  useEffect(() => {
    void loadCouple().catch((e) => setError(e.message));
  }, []);

  async function saveProfile() {
    setBusy(true);
    setError(null);
    try {
      await api('/me', {
        method: 'PATCH',
        body: JSON.stringify({ displayName, pronouns }),
      });
      await refresh();
      haptic('success');
      setMessage('Профиль обновлён');
    } catch (e) {
      setError((e as Error).message);
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
      setError((e as Error).message);
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
    if (!confirm('Удалить общие данные пары (заметки, ответы, шаринги)?')) return;
    await api('/couple/data', { method: 'DELETE' });
    setMessage('Общие данные пары удалены');
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
    setMessage('Аккаунт удалён. Перезапустите приложение.');
  }

  if (!me) return null;

  return (
    <div className="app-shell screen" style={{ overflow: 'hidden' }}>
      <Doodles scene="default" />
      <div style={{ position: 'relative', zIndex: 1 }}>
      <p className="eyebrow">это вы</p>
      <div className="row" style={{ gap: 14, marginTop: 8 }}>
        <Avatar name={me.displayName} photoUrl={me.photoUrl} size={64} />
        <div>
          <h1 className="h2" style={{ margin: 0 }}>
            {me.displayName}
          </h1>
          <p className="lead-hand" style={{ margin: '4px 0 0' }}>
            {me.username ? `@${me.username}` : 'telegram'}
            {me.pronouns ? ` · ${me.pronouns}` : ''}
          </p>
        </div>
      </div>

      {error && <div className="section error-box">{error}</div>}
      {message && <div className="section panel">{message}</div>}

      <section className="section stack">
        <h2 className="h2">Отображение</h2>
        <div className="field">
          <label>Имя</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={64} />
        </div>
        <div className="field">
          <label>Местоимения</label>
          <input value={pronouns} onChange={(e) => setPronouns(e.target.value)} maxLength={32} />
        </div>
        <button className="btn" disabled={busy} onClick={saveProfile}>
          Сохранить
        </button>
      </section>

      <section className="section stack">
        <h2 className="h2">Пара</h2>
        {couple?.couple?.partner ? (
          <div className="panel stack">
            <div className="row">
              <Avatar
                name={couple.couple.partner.displayName}
                photoUrl={couple.couple.partner.photoUrl}
              />
              <div>
                <strong>{couple.couple.partner.displayName}</strong>
                <div className="muted">Вы соединены</div>
              </div>
            </div>
            <button className="btn btn-secondary" onClick={disconnect}>
              Отключиться от пары
            </button>
            <button className="btn btn-danger" onClick={blockPartner}>
              Заблокировать партнёра
            </button>
            <button className="btn btn-ghost" onClick={deleteCoupleData}>
              Удалить общие данные пары
            </button>
          </div>
        ) : (
          <div className="panel stack">
            {couple?.pendingInvite ? (
              <>
                <p className="muted" style={{ margin: 0 }}>
                  Приглашение активно. Отправьте ссылку партнёру.
                </p>
                <code style={{ fontSize: 12, wordBreak: 'break-all' }}>{couple.pendingInvite.link}</code>
                <button
                  className="btn"
                  onClick={() => shareInviteLink(couple.pendingInvite!.link)}
                >
                  Поделиться
                </button>
                <button className="btn btn-ghost" onClick={cancelInvite}>
                  Отменить приглашение
                </button>
              </>
            ) : (
              <>
                <p className="muted" style={{ margin: 0 }}>
                  Создайте персональную ссылку и отправьте её через Telegram.
                </p>
                <button className="btn" disabled={busy} onClick={createInvite}>
                  Пригласить партнёра
                </button>
              </>
            )}
          </div>
        )}
      </section>

      <section className="section panel">
        <h2 className="h2">Уведомления</h2>
        {settings &&
          (
            [
              ['moodNotes', 'Новая заметка от партнёра'],
              ['testInvites', 'Приглашение в совместный тест'],
              ['testPartnerDone', 'Партнёр завершил часть теста'],
              ['dailyQuestion', 'Новый вопрос дня'],
              ['partnerCard', 'Партнёр отправил карточку'],
            ] as Array<[keyof NotificationSettings, string]>
          ).map(([key, label]) => (
            <div className="toggle" key={key}>
              <span>{label}</span>
              <button
                className={`switch ${settings[key] ? 'on' : ''}`}
                aria-pressed={settings[key]}
                onClick={() => toggleSetting(key)}
              />
            </div>
          ))}
      </section>

      <section className="section panel stack">
        <h2 className="h2">Приватность</h2>
        <p className="muted" style={{ margin: 0 }}>
          Личный чат с помощником не виден партнёру. Ответы на личные вопросы не публикуются
          автоматически. Мы не показываем онлайн-статус и геолокацию.
        </p>
        <button className="btn btn-danger" onClick={deleteAccount}>
          Удалить аккаунт и данные
        </button>
      </section>
      </div>
    </div>
  );
}
