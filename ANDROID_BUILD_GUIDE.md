# Mozosubz Android App — Build Guide

## App Info
| Property | Value |
|---|---|
| App Name | Mozosubz |
| App ID | com.mozosubz.app |
| Server URL | https://mozosubz.xyz/login |
| Min Android | 6.0 (API 23) |
| Target Android | 14 (API 34) |

---

## What's Included

### Splash Screen
- Full-screen Mozosubz logo on dark (#0d1117) background
- Auto-hides after 2.5 seconds

### Onboarding (First Launch Only)
- 3 animated slides shown only on first install
- Slide 1: "Manage All Your Subscriptions"
- Slide 2: "Send Money Instantly"
- Slide 3: "Bank-Level Security"
- Next / Skip / Get Started buttons
- Progress dots indicator
- Never shown again after completion
- If a deep link opens the app before onboarding is done, it carries the URL through and loads the right page after onboarding

### Deep Links
- Any `https://mozosubz.xyz/...` link tapped on Android opens directly in the app
- Custom scheme `mozosubz://` also supported as a fallback
- Verified App Links (no chooser dialog) — `assetlinks.json` is served from `mozosubz.xyz/.well-known/assetlinks.json` with the correct certificate fingerprint already set

### Security Improvements
- `FLAG_SECURE` — blocks screenshots and screen recording
- Safe Browsing enabled (Android 8+)
- Mixed content blocked
- File access disabled in WebView
- Cleartext traffic blocked
- ProGuard/R8 minification + obfuscation on release builds
- Log stripping in release
- `allowBackup="false"` — prevents data backup extraction
- Network security config restricts domains

---

## Building the APK

### Automatic (GitHub Actions — Easiest)
Push to `main` → Go to your GitHub repo → **Actions** tab → Download APK from **Artifacts**.

- **Debug APK** — built on every push, no signing needed, for testing only.
- **Signed Release APK** — built on every push to `main`, fully signed and ready to install or upload to Google Play.

> All signing secrets (`KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`) have already been generated and set automatically. No manual setup needed.

### Manual (on your machine)
**Requirements:** Node.js 18+, pnpm, Java JDK 17, Android Studio

```bash
# 1. Install dependencies
pnpm install

# 2. Sync Capacitor
pnpm run android:sync

# 3. Build debug APK
pnpm run android:build
# Output: android/app/build/outputs/apk/debug/app-debug.apk

# 4. Build release APK (minified + obfuscated)
pnpm run android:build:release
# Output: android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### Open in Android Studio
```bash
pnpm run android:open
```

---

## Release Signing

The keystore and all secrets were generated automatically and are already stored in GitHub Actions secrets. No manual steps are required. Every push to `main` produces a fully signed APK.

> **Important:** The keystore password is `Mozosubz@2025` and the key alias is `mozosubz`. Store these somewhere safe (e.g. a password manager) in case you ever need to re-sign manually.

---

## Installing on Android
1. Transfer the `.apk` file to your phone
2. Enable **Install from Unknown Sources**: Settings → Security → Unknown Apps
3. Tap the APK to install
4. App will appear as **Mozosubz** with the brand icon

---

## Updating the App
When you update and redeploy to Vercel, the Android app automatically shows the latest version — **no APK rebuild needed**.

Only rebuild the APK when you change:
- Splash screen or icon
- Onboarding slides
- App permissions
- Native plugin settings
- `capacitor.config.ts`
- Deep link configuration
