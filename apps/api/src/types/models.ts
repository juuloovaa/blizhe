export enum UserMode {
  solo = 'solo',
  couple = 'couple',
}

export enum MoodType {
  need_support = 'need_support',
  want_talk = 'want_talk',
  want_close = 'want_close',
  tired = 'tired',
  anxious = 'anxious',
  grateful = 'grateful',
  feeling_good = 'feeling_good',
}

export enum DailyQuestionType {
  solo = 'solo',
  couple = 'couple',
}

export enum CardCategory {
  closeness = 'closeness',
  reflection = 'reflection',
  romance = 'romance',
  intimate = 'intimate',
}

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
