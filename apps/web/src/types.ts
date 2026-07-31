export type NotificationSettings = {
  moodNotes: boolean;
  testInvites: boolean;
  testPartnerDone: boolean;
  dailyQuestion: boolean;
  partnerCard: boolean;
};

export type Partner = {
  id: string;
  displayName: string;
  photoUrl?: string | null;
  pronouns?: string | null;
};

export type Me = {
  id: string;
  telegramId: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
  displayName: string;
  pronouns?: string | null;
  mode: 'solo' | 'couple';
  onboardingCompleted: boolean;
  notificationSettings?: NotificationSettings | null;
  couple: null | {
    id: string;
    status: string;
    role: string;
    partner: Partner | null;
  };
};

export type MoodType =
  | 'need_support'
  | 'want_talk'
  | 'want_close'
  | 'tired'
  | 'anxious'
  | 'grateful'
  | 'feeling_good';

export const MOOD_LABELS: Record<MoodType, string> = {
  need_support: 'Нужна поддержка',
  want_talk: 'Хочу поговорить',
  want_close: 'Хочу побыть рядом',
  tired: 'Устал(а)',
  anxious: 'Чувствую тревогу',
  grateful: 'Благодарен(на) тебе',
  feeling_good: 'Мне хорошо с тобой',
};
