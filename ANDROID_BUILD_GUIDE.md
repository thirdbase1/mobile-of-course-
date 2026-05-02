# Msubz Android App — Build Guide

## App Info
| Property | Value |
|---|---|
| App Name | Msubz |
| App ID | com.msubz.app |
| Server URL | https://v0-mobile-one-liart.vercel.app |
| Min Android | 6.0 (API 23) |
| Target Android | 14 (API 34) |

---

## What's Included

### Splash Screen
- Full-screen Msubz logo on dark (#0d1117) background
- Auto-hides after 2.5 seconds

### Onboarding (First Launch Only)
- 3 animated slides shown only on first install
- Slide 1: "Manage All Your Subscriptions"
- Slide 2: "Send Money Instantly"
- Slide 3: "Bank-Level Security"
- Next / Skip / Get Started buttons
- Progress dots indicator
- Never shown again after completion

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
- **Signed Release APK** — built on every push to `main`, fully signed and ready to install or upload to Google Play. Requires the signing secrets below to be configured first.

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

## Release Signing Setup (one-time)

The GitHub Actions workflow automatically signs the release APK using a keystore stored as GitHub secrets. You only need to do this setup once.

### Step 1 — Generate a keystore

Run the helper script from the project root:

```bash
./scripts/generate-keystore.sh
```

This runs `keytool` interactively — enter a strong password when prompted. The keystore file `release.keystore` will be created in the project root (it is already gitignored).

### Step 2 — Encode the keystore as base64

```bash
base64 -w 0 release.keystore
```

Copy the entire output string.

### Step 3 — Add 4 GitHub secrets

Go to: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Value |
|---|---|
| `KEYSTORE_BASE64` | The base64 string from Step 2 |
| `KEYSTORE_PASSWORD` | The keystore password you chose |
| `KEY_ALIAS` | `mozosubz-key` |
| `KEY_PASSWORD` | The key password you chose (can be same as keystore password) |

### Step 4 — Push to main

The next push to `main` will produce a **signed** APK named `mozosubz-release-signed-<run_number>.apk` in the Actions artifacts. This APK can be installed on any Android phone and submitted to the Google Play Store.

> **Keep your keystore safe!** Back it up to a secure location (password manager, encrypted cloud storage). If you lose it you cannot publish future updates to the Play Store under the same app listing.

---

## Installing on Android
1. Transfer the `.apk` file to your phone
2. Enable **Install from Unknown Sources**: Settings → Security → Unknown Apps
3. Tap the APK to install
4. App will appear as **Msubz** with the brand icon

---

## Updating the App
When you update and redeploy to Vercel, the Android app automatically shows the latest version — **no APK rebuild needed**.

Only rebuild the APK when you change:
- Splash screen or icon
- Onboarding slides
- App permissions
- Native plugin settings
- `capacitor.config.ts`
