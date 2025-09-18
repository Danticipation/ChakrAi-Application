export const APP_ROUTES = [
  'daily',
  'journal',
  'memory',
  'analytics',
  'questions',
  'feedback',
  'challenges',
  'rewards',
  'community',
  'adaptive',
  'therapy-plans',
  'agents',
  'vr',
  'health',
  'ambient-sound',
  'privacy',
  'therapist',
  'outcomes',
  'ehr',
  'privacy-policy',
  'microphone-test',
  'horoscope',
  'affirmation',
  'themes'
];

export const isValidRoute = (route: string): boolean => APP_ROUTES.includes(route);
