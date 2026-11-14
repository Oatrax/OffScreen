/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1E1B3A',
    background: '#F4F1FF',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E6E0FF',
    textSecondary: '#6B678A',
    accent: '#6C5CE7',
    accentSoft: '#E9E5FF',
    success: '#00B589',
    danger: '#FF5A7A',
    warning: '#FFA620',
    pink: '#FF6FB1',
    sky: '#2FB5F5',
  },
  dark: {
    text: '#F3F1FF',
    background: '#14122B',
    backgroundElement: '#211E45',
    backgroundSelected: '#312D63',
    textSecondary: '#A9A5CF',
    accent: '#8B7CFF',
    accentSoft: '#322E68',
    success: '#2EE6B0',
    danger: '#FF7A93',
    warning: '#FFC247',
    pink: '#FF8CC4',
    sky: '#5CCBFF',
  },
} as const;

/** Hero gradients (used on Today / Profile). */
export const Gradients = {
  locked: ['#6C5CE7', '#A855F7', '#FF6FB1'],
  unlocked: ['#00B589', '#2FB5F5', '#6C5CE7'],
  profile: ['#FF9A3D', '#FF6FB1', '#6C5CE7'],
} as const;

/** Soft card shadow; looks right on the tinted light background and is subtle in dark. */
export const CardShadow = {
  shadowColor: '#4B3FC9',
  shadowOpacity: 0.12,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
