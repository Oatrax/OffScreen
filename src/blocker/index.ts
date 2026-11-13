/**
 * Boundary between UI/data and the (future) native app-blocker.
 * The Kotlin implementation (foreground service + overlay) will live in a local
 * Expo module and be wired in here. UI code must only import from this file.
 * Currently a no-op stub: nothing is blocked.
 */
export type InstalledApp = { packageName: string; label: string };

export type PermissionStatus = {
  usageAccess: boolean;
  overlay: boolean;
};

export interface Blocker {
  listInstalledApps(): Promise<InstalledApp[]>;
  getPermissionStatus(): Promise<PermissionStatus>;
  /** Push the current locked package list to the native service. */
  setLockedPackages(packages: string[]): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export const blocker: Blocker = {
  async listInstalledApps() {
    return [];
  },
  async getPermissionStatus() {
    return { usageAccess: false, overlay: false };
  },
  async setLockedPackages() {},
  async start() {},
  async stop() {},
};
