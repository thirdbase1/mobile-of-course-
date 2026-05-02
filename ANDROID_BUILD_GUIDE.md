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
- Never shown again after completion
- Deep links that arrive before onboarding finishes are carried through and loaded after

### Deep Links
- Any `https://mozosubz.xyz/...` link tapped on Android opens directly in the app — no browser chooser prompt
- Custom scheme `mozosubz://` also supported as a fallback

### Push Notifications (Firebase)
- Broadcast notifications can be sent to all users from the Firebase Console
- Tapping a notification opens the app; if a `url` is included in the data payload it loads that page directly
- Supports both notification and data payloads
- Android 13+ users are prompted to allow notifications on first launch
- Requires a real `google-services.json` — see setup below

### In-App Update Prompts
- On each app launch (max once per 24 hours) the app silently checks GitHub for a new release
- If a newer version exists the user sees a dialog: "Update Available — vX.X.X" with an "Update Now" button
- "Update Now" opens the GitHub releases page where they can download the new APK
- Fully automatic — no backend needed

### Security
- `FLAG_SECURE` — blocks screenshots and screen recording
- Safe Browsing enabled (Android 8+)
- Mixed content blocked, file access disabled in WebView
- Cleartext traffic blocked
- ProGuard/R8 minification + obfuscation on release builds
- `allowBackup="false"` — prevents data backup extraction

---

## Building the APK

### Automatic (GitHub Actions — Recommended)
Push to `main` → GitHub repo → **Actions** tab → Download APK from **Artifacts**.

- **Debug APK** — every push, no signing needed, for testing only
- **Signed Release APK** — every push to `main`, fully signed, ready to install or submit to Google Play

All signing secrets are already set in GitHub Actions. No manual setup required.

### Manual (on your machine)
**Requirements:** Node.js 18+, pnpm, Java JDK 17, Android Studio

```bash
pnpm install
pnpm run android:sync
pnpm run android:build          # debug
pnpm run android:build:release  # release
```

---

## Firebase Push Notifications Setup (one-time)

> This only needs to be done once. It does not require any changes to your website.

### Step 1 — Create a free Firebase project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it `Mozosubz` → continue through the steps
3. In the project dashboard click the **Android** icon (Add app)
4. Enter package name: `com.mozosubz.app`
5. Click **Register app**
6. Download the `google-services.json` file

### Step 2 — Add the file to the repo
Replace `android/app/google-services.json` with the file you downloaded.
The real file contains your actual Firebase project keys — **never share it publicly**.

Commit and push to `main`. The next GitHub Actions build will include Firebase fully enabled.

### Step 3 — Send your first notification
1. Firebase Console → your project → **Messaging** (in the left sidebar)
2. Click **New campaign → Firebase Notification messages**
3. Write your title + message → **Next** → **Target: app** → Send

That's it. Every installed user receives the notification instantly.

---

## Signing Info
| | Value |
|---|---|
| Keystore password | `Mozosubz@2025` |
| Key alias | `mozosubz` |
| Key password | `Mozosubz@2025` |

Store these in a password manager. You need them if you ever re-sign the APK manually.

---

## Installing on Android
1. Transfer the `.apk` to your phone
2. Settings → Security → **Install from Unknown Sources** → enable
3. Tap the APK to install
4. App appears as **Mozosubz** with the brand icon

---

## Updating the App
When you redeploy to Vercel, the Android app shows the latest version automatically — **no APK rebuild needed**.

Rebuild the APK only when you change native things:
- Splash screen / icon
- Onboarding slides
- App permissions
- Firebase config (`google-services.json`)
- Deep link configuration
- `capacitor.config.ts`
