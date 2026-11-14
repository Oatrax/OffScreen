# OffScreen Roadmap

Detection approach: foreground service polling `UsageStatsManager` (Usage Access) + lock Activity launched
over the blocked app (Draw Over Other Apps). Accessibility service is deliberately avoided for MVP (Play policy risk).

| # | Phase | Scope | Status |
|---|-------|-------|--------|
| 0 | Foundation | Nav shell, SQLite, Planner, Today, App Lock picker, PIN vault | Done |
| 1 | Permissions | Manifest perms, native status + settings deep-links, `usePermissions`, Settings checker, Today banner | Written, needs device test |
| 2 | Lock sync + service | `BlockerStore` prefs, `BlockerService` (foreground, UsageEvents polling), `syncBlocker` | Written, needs device test |
| 3 | Lock screen | `LockActivity`: PIN entry, attempt lockout, back/leave to home | Written, needs device test |
| 4 | Task-gated unlock | `features/unlock`: daily PIN, reveal only when tasks done, auto/PIN modes, strict mode | Written, needs device test |
| 5 | Resilience | `BootReceiver`, START_STICKY, battery-optimization prompt, stale-PIN rejection | Written, needs device test |
| 6 | Profile / Stats / Settings | Streaks, completed vs missed, blocked opens + est. time saved, unlock mode, strict mode | Written, needs device test |
| 7 | Release | `eas.json` (aab profile), `docs/RELEASE.md` Play declarations + QA list | Config done; signing/store listing is manual |
