# OffScreen

An Android app that blocks the apps that distract you — until you finish your daily tasks.

Pick the apps you want locked (e.g. Instagram, TikTok). While locked, opening one of them shows a lock screen that can't be dismissed. OffScreen holds a hidden PIN and only reveals it (or unlocks automatically) once every task you planned for the day is done.

## Features
- **Planner**: daily and recurring tasks, including timed and multi-step tasks
- **Today** screen with progress toward unlocking and current lock status
- **App Lock**: picker for installed apps, with per-app lock toggles
- **Task-gated unlock** with auto-unlock or PIN-reveal modes, and a strict mode
- **Stats and profile**: streaks, tasks completed vs. missed, blocked opens, estimated time saved
- **Local-first**: everything is stored on the device (SQLite); no account, no cloud
- **Resilient blocking**: restarts after reboot, PIN attempt lockout, stale-PIN rejection

## How blocking works
A native Kotlin Expo module (`modules/offscreen-blocker`) runs a foreground service that polls `UsageStatsManager` to detect the foreground app. When a locked app opens, it launches a `LockActivity` over it (Draw Over Other Apps). An Accessibility service is deliberately avoided because of Google Play policy risk. The PIN is generated on the device and kept in secure storage.

## Tech stack
React Native 0.88 · Expo (Expo Router) · TypeScript · expo-sqlite · expo-secure-store · Kotlin native module (foreground service, boot receiver, lock activity)

## Run it
Needs a development build because of the native module (Expo Go won't work), plus an Android device or emulator:
```bash
npm install
npx expo run:android
```
Grant **Usage Access** and **Display over other apps** when prompted (Settings → Permissions shows what each one is for).

## Status
Work in progress. The blocking engine, task-gated unlock and stats are written; remaining work is on-device testing across manufacturers and the Play Store release steps. See [`ROADMAP.md`](ROADMAP.md) and [`docs/RELEASE.md`](docs/RELEASE.md).
