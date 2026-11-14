import { requireOptionalNativeModule } from 'expo';

export type PermissionKind = 'usageAccess' | 'overlay' | 'notifications' | 'battery';
export type NativePermissionStatus = Record<PermissionKind, boolean>;

export type NativeApp = { packageName: string; label: string; isSystem: boolean };

type OffscreenBlockerNative = {
  getInstalledApps(): Promise<NativeApp[]>;
  /** Base64 PNG without a data: prefix, or null. */
  getAppIcon(packageName: string): Promise<string | null>;
  getPermissionStatus(): NativePermissionStatus;
  openPermissionSettings(kind: PermissionKind): void;
  setLockedPackages(packages: string[]): void;
  /** `day` is the local date (YYYY-MM-DD) the PIN is valid for. */
  setPin(pin: string, day: string): void;
  applyTaskState(complete: boolean, autoUnlock: boolean): void;
  startBlocking(): void;
  stopBlocking(): void;
  getBlockStats(): { total: number; today: number };
};

/** null when running somewhere the native module isn't compiled in (Expo Go, web). */
export default requireOptionalNativeModule<OffscreenBlockerNative>('OffscreenBlocker');
