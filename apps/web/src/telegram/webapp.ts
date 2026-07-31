export type TelegramThemeParams = {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  destructive_text_color?: string;
};

type TelegramWebApp = {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
    };
    start_param?: string;
  };
  colorScheme: 'light' | 'dark';
  themeParams: TelegramThemeParams;
  ready: () => void;
  expand: () => void;
  close: () => void;
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    setText: (text: string) => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
  };
  openTelegramLink: (url: string) => void;
  openLink: (url: string) => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function getWebApp(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

export function initTelegramApp() {
  const wa = getWebApp();
  if (!wa) return null;
  wa.ready();
  wa.expand();
  applyTheme(wa);
  return wa;
}

export function applyTheme(wa = getWebApp()) {
  if (!wa) return;
  const t = wa.themeParams;
  const root = document.documentElement;
  root.style.setProperty('--tg-bg', t.bg_color || '#f7f3ee');
  root.style.setProperty('--tg-text', t.text_color || '#1c1917');
  root.style.setProperty('--tg-hint', t.hint_color || '#78716c');
  root.style.setProperty('--tg-link', t.link_color || '#0f766e');
  root.style.setProperty('--tg-button', t.button_color || '#0f766e');
  root.style.setProperty('--tg-button-text', t.button_text_color || '#ffffff');
  root.style.setProperty('--tg-secondary', t.secondary_bg_color || '#ebe4da');
  root.dataset.colorScheme = wa.colorScheme;
  try {
    wa.setHeaderColor(t.bg_color || '#f7f3ee');
    wa.setBackgroundColor(t.bg_color || '#f7f3ee');
  } catch {
    // older clients
  }
}

export function haptic(type: 'light' | 'success' | 'selection' = 'light') {
  const h = getWebApp()?.HapticFeedback;
  if (!h) return;
  if (type === 'success') h.notificationOccurred('success');
  else if (type === 'selection') h.selectionChanged();
  else h.impactOccurred('light');
}

export function getInitData(): string {
  const wa = getWebApp();
  if (wa?.initData) return wa.initData;

  // Dev fallback: ?devUser=1001:Anna or localStorage
  const params = new URLSearchParams(window.location.search);
  const dev = params.get('devUser') || localStorage.getItem('blizhe_dev_user');
  if (dev) {
    localStorage.setItem('blizhe_dev_user', dev);
    return `dev:${dev}`;
  }
  return 'dev:1001:Анна';
}

export function getStartInviteCode(): string | null {
  const wa = getWebApp();
  const start = wa?.initDataUnsafe?.start_param;
  if (start?.startsWith('invite_')) return start.replace(/^invite_/, '');

  const params = new URLSearchParams(window.location.search);
  return params.get('invite');
}

export function shareInviteLink(link: string) {
  const wa = getWebApp();
  const text = encodeURIComponent('Давай станем ближе — открой приглашение в приложении «Ближе»');
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${text}`;
  if (wa?.openTelegramLink) wa.openTelegramLink(shareUrl);
  else window.open(shareUrl, '_blank');
}
