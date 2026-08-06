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
  if (typeof window === 'undefined') return null;
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
  if (!wa || typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--tg-bg', '#fbf6ee');
  root.style.setProperty('--tg-text', '#2a2f2c');
  root.style.setProperty('--tg-hint', '#6b736e');
  root.style.setProperty('--tg-link', '#2f6b57');
  root.style.setProperty('--tg-button', '#f07858');
  root.style.setProperty('--tg-button-text', '#fffaf5');
  root.style.setProperty('--tg-secondary', '#f3ebe0');
  root.dataset.colorScheme = 'light';
  try {
    wa.setHeaderColor('#fbf6ee');
    wa.setBackgroundColor('#fbf6ee');
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
  if (typeof window === 'undefined') return 'dev:1001:Анна';
  const wa = getWebApp();
  if (wa?.initData) return wa.initData;

  const params = new URLSearchParams(window.location.search);
  const dev = params.get('devUser') || localStorage.getItem('blizhe_dev_user');
  if (dev) {
    localStorage.setItem('blizhe_dev_user', dev);
    return `dev:${dev}`;
  }
  return 'dev:1001:Анна';
}

export function getStartInviteCode(): string | null {
  if (typeof window === 'undefined') return null;
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
