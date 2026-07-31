export const UserMode = {
  solo: 'solo',
  couple: 'couple',
} as const;
export type UserMode = (typeof UserMode)[keyof typeof UserMode];

export const MoodType = {
  need_support: 'need_support',
  want_talk: 'want_talk',
  want_close: 'want_close',
  tired: 'tired',
  anxious: 'anxious',
  grateful: 'grateful',
  feeling_good: 'feeling_good',
} as const;
export type MoodType = (typeof MoodType)[keyof typeof MoodType];

export const DailyQuestionType = {
  solo: 'solo',
  couple: 'couple',
} as const;
export type DailyQuestionType = (typeof DailyQuestionType)[keyof typeof DailyQuestionType];

export const CardCategory = {
  closeness: 'closeness',
  reflection: 'reflection',
  romance: 'romance',
  intimate: 'intimate',
} as const;
export type CardCategory = (typeof CardCategory)[keyof typeof CardCategory];

export type AuthUser = {
  id: string;
  telegramId: bigint;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  displayName: string;
  pronouns: string | null;
  mode: UserMode;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};
