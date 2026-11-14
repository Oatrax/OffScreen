import OffscreenBlocker, { type PermissionKind } from '../../modules/offscreen-blocker';

export type { PermissionKind };

/**
 * Boundary between UI/data and the native app-blocker (Kotlin, in modules/offscreen-blocker).
 * UI code must only import from this file. Every method is a safe no-op in Expo Go / web.
 */
export type InstalledApp = { packageName: string; label: string; isSystem: boolean };

export type PermissionStatus = Record<PermissionKind, boolean>;

export type BlockStats = { total: number; today: number };

export interface Blocker {
  /** False in Expo Go / web, where the native module isn't compiled in. */
  readonly isNativeAvailable: boolean;
  listInstalledApps(): Promise<InstalledApp[]>;
  /** Base64 PNG (no data: prefix) or null. */
  getAppIcon(packageName: string): Promise<string | null>;
  getPermissionStatus(): Promise<PermissionStatus>;
  /** Opens the system screen where the user can grant the permission. */
  openPermissionSettings(kind: PermissionKind): Promise<void>;
  /** Push the current locked package list to the native service. */
  setLockedPackages(packages: string[]): Promise<void>;
  /** Hands the native lock screen today's PIN (stored there only as a salted hash). */
  setPin(pin: string, day: string): Promise<void>;
  /** Re-locks when tasks are incomplete; unlocks for today when complete and `autoUnlock`. */
  applyTaskState(complete: boolean, autoUnlock: boolean): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  getBlockStats(): Promise<BlockStats>;
}

/** Sample apps so the UI can be exercised in Expo Go. Never persisted as real data (see App Lock screen). */
const DEMO_APPS: InstalledApp[] = [
  ['com.demo.instagram', 'Instagram (demo)'],
  ['com.demo.tiktok', 'TikTok (demo)'],
  ['com.demo.youtube', 'YouTube (demo)'],
  ['com.demo.reddit', 'Reddit (demo)'],
  ['com.demo.x', 'X (demo)'],
].map(([packageName, label]) => ({ packageName, label, isSystem: false }));

export const blocker: Blocker = {
  isNativeAvailable: OffscreenBlocker !== null,

  async listInstalledApps() {
    return OffscreenBlocker ? OffscreenBlocker.getInstalledApps() : DEMO_APPS;
  },
  async getAppIcon(packageName) {
    return OffscreenBlocker ? OffscreenBlocker.getAppIcon(packageName) : null;
  },
  async getPermissionStatus() {
    return OffscreenBlocker
      ? OffscreenBlocker.getPermissionStatus()
      : { usageAccess: false, overlay: false, notifications: false, battery: false };
  },
  async openPermissionSettings(kind) {
    OffscreenBlocker?.openPermissionSettings(kind);
  },
  async setLockedPackages(packages) {
    OffscreenBlocker?.setLockedPackages(packages);
  },
  async setPin(pin, day) {
    OffscreenBlocker?.setPin(pin, day);
  },
  async applyTaskState(complete, autoUnlock) {
    OffscreenBlocker?.applyTaskState(complete, autoUnlock);
  },
  async start() {
    OffscreenBlocker?.startBlocking();
  },
  async stop() {
    OffscreenBlocker?.stopBlocking();
  },
  async getBlockStats() {
    return OffscreenBlocker ? OffscreenBlocker.getBlockStats() : { total: 0, today: 0 };
  },
};
