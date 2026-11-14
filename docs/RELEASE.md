# Release checklist (Google Play)

## Build
- Signed `.aab`: `npx eas-cli build -p android --profile production` (EAS manages the upload key), or build locally with
  `cd android && ./gradlew bundleRelease` after adding your own keystore to `android/app/build.gradle` (never commit the `.jks`).
- Test builds: `--profile preview` produces an installable `.apk`.
- Bump `expo.version` in `app.json` for each release (`versionCode` is auto-incremented by EAS).

## Play Console declarations (these will be reviewed)
| Item | What to declare |
|---|---|
| Foreground service type `specialUse` | Subtype text is in the module manifest: detects launch of user-selected apps to show a self-imposed lock screen. Provide a short demo video. |
| `PACKAGE_USAGE_STATS` | Core functionality: identify the foreground app the user chose to lock. Data never leaves the device. |
| `SYSTEM_ALERT_WINDOW` | Core functionality: show the lock screen above a locked app. |
| `RECEIVE_BOOT_COMPLETED` | Restart blocking after reboot. |
| `POST_NOTIFICATIONS` | Required notification for the foreground service. |
| Data safety | No data collected or shared; everything is stored locally. No account. |
| `QUERY_ALL_PACKAGES` | Not used (launcher `<queries>` only). |

## Policy notes
- OffScreen is a self-control tool: the user explicitly picks the apps and can see what the permissions are for
  (Settings > Permissions). Keep the in-app explanations accurate; reviewers read them.
- Do not add an Accessibility service without re-reading the Play Accessibility API policy.
- Provide a privacy policy URL (even for local-only apps) in the store listing.

## QA before submitting
- Test on at least: Pixel (stock), Samsung (One UI), Xiaomi/Oppo (aggressive background killing).
- Reboot with locks active: service should restart (notification reappears).
- Midnight rollover: locks re-engage and a new PIN is issued the next time the app opens.
- Revoke usage access / overlay with locks active: Today shows the permission banner.
- Android 14 and 15: confirm the lock screen appears over a locked app opened from the launcher.

## Known limits
- A user can still uninstall OffScreen, force-stop it, or revoke permissions from system settings. Device-admin
  or accessibility-based hardening is possible but carries Play policy risk and is not implemented.
- Locking the Settings app or the Play Store is not special-cased: lock them in the App Lock list if desired.
