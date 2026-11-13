import { requireOptionalNativeModule } from 'expo';

export type NativeApp = { packageName: string; label: string; isSystem: boolean };

type OffscreenBlockerNative = {
  getInstalledApps(): Promise<NativeApp[]>;
  /** Base64 PNG without a data: prefix, or null. */
  getAppIcon(packageName: string): Promise<string | null>;
};

/** null when running somewhere the native module isn't compiled in (Expo Go, web). */
export default requireOptionalNativeModule<OffscreenBlockerNative>('OffscreenBlocker');
