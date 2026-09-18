/** User preferences — stored in localStorage, loaded synchronously at startup. */

export interface UserPreferences {
  name: string;
  workStart: string;      // HH:mm e.g. "14:00"
  workEnd: string;        // HH:mm e.g. "23:00"
  timezone: string;       // IANA e.g. "Asia/Kolkata"
  selectedGoals: Array<'career' | 'health' | 'errands' | 'learning'>;
  onboardingComplete: boolean;
}

const PREFS_KEY = 'apex_user_prefs';

const DEFAULTS: UserPreferences = {
  name: '',
  workStart: '14:00',
  workEnd: '23:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  selectedGoals: [],
  onboardingComplete: false,
};

export function getPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function savePreferences(prefs: Partial<UserPreferences>): UserPreferences {
  const current = getPreferences();
  const updated = { ...current, ...prefs };
  localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  return updated;
}

export function isOnboardingComplete(): boolean {
  return getPreferences().onboardingComplete;
}

export function markOnboardingComplete(prefs: Partial<UserPreferences>): UserPreferences {
  return savePreferences({ ...prefs, onboardingComplete: true });
}

