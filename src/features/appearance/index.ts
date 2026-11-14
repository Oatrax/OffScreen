import type { SQLiteDatabase } from 'expo-sqlite';
import { Appearance } from 'react-native';

import { getSetting, setSetting } from '@/data/repositories';

export type ThemePreference = 'light' | 'dark' | 'system';

const KEY = 'theme_preference';

export async function getThemePreference(db: SQLiteDatabase): Promise<ThemePreference> {
  const v = await getSetting(db, KEY);
  return v === 'dark' || v === 'system' ? v : 'light';
}

/** Applies the preference app-wide (every useColorScheme consumer and the status bar follow). */
export function applyThemePreference(pref: ThemePreference) {
  Appearance.setColorScheme(pref === 'system' ? 'unspecified' : pref);
}

/** Called before the first screen renders so there is no light/dark flash. */
export async function applyStoredTheme(db: SQLiteDatabase) {
  applyThemePreference(await getThemePreference(db));
}

export async function setThemePreference(db: SQLiteDatabase, pref: ThemePreference) {
  await setSetting(db, KEY, pref);
  applyThemePreference(pref);
}
