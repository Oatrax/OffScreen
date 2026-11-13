import OffscreenBlocker from '../../modules/offscreen-blocker';

/**
 * Boundary between UI/data and the native app-blocker (Kotlin, in modules/offscreen-blocker).
 * UI code must only import from this file.
 *
 * Implemented: installed-app listing and icons.
 * Not yet implemented (stubs): permissions, lock list sync, start/stop of the blocking service.
 */
export type InstalledApp = { packageName: string; label: string; isSystem: boolean };

export type PermissionStatus = {
  usageAccess: boolean;
  overlay: boolean;
};

export interface Blocker {
  /** False in Expo Go / web, where the native module isn't compiled in. */
  readonly isNativeAvailable: boolean;
  listInstalledApps(): Promise<InstalledApp[]>;
  /** Base64 PNG (no data: prefix) or null. */
  getAppIcon(packageName: string): Promise<string | null>;
  getPermissionStatus(): Promise<PermissionStatus>;
  /** Push the current locked package list to the native service. */
  setLockedPackages(packages: string[]): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
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

  // --- Not implemented yet ---
  async getPermissionStatus() {
    return { usageAccess: false, overlay: false };
  },
  async setLockedPackages() {},
  async start() {},
  async stop() {},
};
