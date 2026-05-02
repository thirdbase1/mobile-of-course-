# Android Build Guide — ThirdBase

## How It Works

This app uses **Capacitor** to wrap the deployed web app inside a native Android WebView.  
The Android app loads your live Vercel URL — all features (auth, payments, dashboard) work as-is.

---

## Step 1 — Set Your Deployed URL

Open `capacitor.config.ts` and replace the server URL:

```ts
server: {
  url: 'https://YOUR-ACTUAL-VERCEL-URL.vercel.app',
  cleartext: false,
},
```

Also update `android/app/src/main/res/xml/network_security_config.xml`:
```xml
<domain includeSubdomains="true">YOUR-ACTUAL-VERCEL-URL.vercel.app</domain>
```

---

## Step 2 — Requirements (on your local machine)

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Java JDK 17 ([download](https://adoptium.net/))
- Android Studio ([download](https://developer.android.com/studio))
- Android SDK (installed via Android Studio → SDK Manager)

---

## Step 3 — Build the APK

```bash
# 1. Install dependencies
pnpm install

# 2. Sync Capacitor with Android project
pnpm run android:sync

# 3. Build debug APK (output: android/app/build/outputs/apk/debug/app-debug.apk)
pnpm run android:build

# OR open in Android Studio
pnpm run android:open
```

---

## Option B — Automatic Build via GitHub Actions

Every push to `main` automatically triggers a GitHub Actions workflow that:
- Builds the debug APK
- Uploads it as a downloadable artifact

Go to your GitHub repo → **Actions** tab → latest workflow run → **Artifacts** to download the APK.

---

## Installing the APK on Android

1. Transfer `app-debug.apk` to your Android phone
2. Enable **Install from Unknown Sources** in Settings → Security
3. Open the APK file and install

---

## App Details

| Property | Value |
|----------|-------|
| App ID | com.thirdbase.app |
| App Name | ThirdBase |
| Min Android Version | 6.0 (API 23) |
| Target Android Version | 14 (API 34) |

---

## Updating the App

When you make changes to the web app and redeploy to Vercel, the Android app automatically shows the latest version — no rebuild needed.

Only rebuild the APK when you change:
- `capacitor.config.ts`
- Android permissions (`AndroidManifest.xml`)
- App icon or splash screen
- Native plugin settings
