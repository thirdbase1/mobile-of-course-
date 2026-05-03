package com.mozosubz.app;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.ContactsContract;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.FrameLayout;
import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String TAG                      = "MozosubzMain";
    private static final String BASE_URL                 = "https://mozosubz.xyz";
    private static final int    NOTIF_PERMISSION_CODE    = 101;
    private static final int    CONTACTS_PERMISSION_CODE = 102;

    private View    offlineOverlay;
    private boolean wasOffline = false;

    private WebView loadingWebView;
    private boolean loadingDismissed = false;

    // Contact picker
    private ActivityResultLauncher<Intent> contactPickerLauncher;
    private volatile String                pendingContactCallbackId;

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);

        // Register contact picker result handler (must be before onStart)
        contactPickerLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            this::onContactPickerResult);

        // Replace Capacitor's default WebViewClient with our extended version
        getBridge().getWebView().setWebViewClient(
            new MozosubzWebViewClient(getBridge(), this));

        // Add contacts bridge so JS can call window.MozosubzContacts.pickContact()
        getBridge().getWebView().addJavascriptInterface(
            new ContactsPickerBridge(this), "MozosubzContacts");

        applyFullScreen();
        applyWebViewHardening();
        MozosubzFirebaseService.ensureChannel(this);
        requestNotificationPermission();
        requestContactsPermission();
        setupOfflineOverlay();
        startNetworkMonitoring();
        showLoadingScreen();

        if (!checkOnboarding()) {
            handleDeepLink(getIntent());
            new UpdateChecker(this).checkIfNeeded();
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // Re-apply full-screen whenever we regain focus (keyboard, dialogs, etc.
        // can temporarily reveal system bars)
        if (hasFocus) applyFullScreen();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleDeepLink(intent);
    }

    // ── Full-screen immersive mode ────────────────────────────────────────────

    @SuppressWarnings("deprecation")
    private void applyFullScreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            android.view.WindowInsetsController wic =
                getWindow().getInsetsController();
            if (wic != null) {
                wic.hide(android.view.WindowInsets.Type.statusBars()
                       | android.view.WindowInsets.Type.navigationBars());
                wic.setSystemBarsBehavior(
                    android.view.WindowInsetsController
                        .BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN);
        }
    }

    // ── Branded loading screen ────────────────────────────────────────────────

    private void showLoadingScreen() {
        FrameLayout root = (FrameLayout) getWindow().getDecorView()
            .findViewById(android.R.id.content);

        loadingWebView = new WebView(this);
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT);
        loadingWebView.setLayoutParams(lp);
        loadingWebView.setBackgroundColor(0xFF0B1120);

        WebSettings ws = loadingWebView.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setAllowFileAccess(true);

        loadingWebView.loadUrl("file:///android_asset/loading.html");
        root.addView(loadingWebView);

        new Handler(Looper.getMainLooper()).postDelayed(
            this::hideLoadingScreen, 3500);
    }

    private void hideLoadingScreen() {
        if (loadingDismissed || loadingWebView == null) return;
        loadingDismissed = true;
        final WebView lv = loadingWebView;
        runOnUiThread(() ->
            lv.animate()
                .alpha(0f)
                .setDuration(450)
                .withEndAction(() -> {
                    try {
                        FrameLayout root = (FrameLayout) getWindow().getDecorView()
                            .findViewById(android.R.id.content);
                        root.removeView(lv);
                    } catch (Exception ignored) {}
                    loadingWebView = null;
                }).start());
    }

    // ── Branded error page ────────────────────────────────────────────────────

    public void showWebError(WebView webView, int errorCode) {
        runOnUiThread(() -> {
            try {
                java.io.InputStream is = getAssets().open("error.html");
                byte[] buf = new byte[is.available()];
                is.read(buf);
                is.close();
                String html = new String(buf, "UTF-8")
                    .replace("location.search || location.hash || ''",
                        "'?code=" + errorCode + "'");
                webView.loadDataWithBaseURL(
                    "file:///android_asset/", html, "text/html", "UTF-8", null);
            } catch (Exception e) {
                Log.e(TAG, "showWebError: " + e.getMessage());
            }
        });
    }

    // ── Native Contact Picker ─────────────────────────────────────────────────

    /**
     * Called from ContactsPickerBridge (JS thread) when the website requests a contact.
     * Stores the callbackId then launches the system contact picker on the UI thread.
     */
    public void launchContactPicker(String callbackId) {
        pendingContactCallbackId = callbackId;
        runOnUiThread(() -> {
            try {
                Intent intent = new Intent(Intent.ACTION_PICK,
                    ContactsContract.Contacts.CONTENT_URI);
                contactPickerLauncher.launch(intent);
            } catch (Exception e) {
                Log.e(TAG, "launchContactPicker: " + e.getMessage());
                deliverContactToJs(callbackId, null);
            }
        });
    }

    /** Handles the result from the system contact picker. */
    private void onContactPickerResult(ActivityResult result) {
        String callbackId = pendingContactCallbackId;
        pendingContactCallbackId = null;
        if (callbackId == null) return;

        String contactJson = null;
        if (result.getResultCode() == RESULT_OK && result.getData() != null) {
            contactJson = readContact(result.getData().getData());
        }
        deliverContactToJs(callbackId, contactJson);
    }

    /**
     * Reads name + phone numbers from the given contact Uri and returns a
     * Web Contacts API-compatible JSON string, or null on failure.
     */
    private String readContact(Uri contactUri) {
        if (contactUri == null) return null;
        ContentResolver cr = getContentResolver();
        try (Cursor c = cr.query(contactUri, null, null, null, null)) {
            if (c == null || !c.moveToFirst()) return null;

            String name = c.getString(
                c.getColumnIndexOrThrow(ContactsContract.Contacts.DISPLAY_NAME));
            String id = c.getString(
                c.getColumnIndexOrThrow(ContactsContract.Contacts._ID));

            // Collect phone numbers
            StringBuilder phonesArr = new StringBuilder();
            try (Cursor ph = cr.query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                new String[]{ContactsContract.CommonDataKinds.Phone.NUMBER},
                ContactsContract.CommonDataKinds.Phone.CONTACT_ID + " = ?",
                new String[]{id}, null)) {
                if (ph != null) {
                    boolean first = true;
                    while (ph.moveToNext()) {
                        String num = ph.getString(0);
                        if (num == null || num.trim().isEmpty()) continue;
                        if (!first) phonesArr.append(',');
                        phonesArr.append('"').append(escapeJson(num.trim())).append('"');
                        first = false;
                    }
                }
            }

            // Web Contacts API shape: { name: [...], tel: [...], email: [], address: [] }
            return "{\"name\":[\"" + escapeJson(name) + "\"]," +
                   "\"tel\":[" + phonesArr + "]," +
                   "\"email\":[]," +
                   "\"address\":[]}";
        } catch (Exception e) {
            Log.e(TAG, "readContact: " + e.getMessage());
            return null;
        }
    }

    /** Calls window[callbackId](json) on the page — resolves the JS promise. */
    private void deliverContactToJs(String callbackId, String json) {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        String arg = json != null
            ? "'" + json.replace("'", "\\'") + "'"
            : "null";
        String js = "if(typeof window['" + callbackId + "']==='function')" +
                    "window['" + callbackId + "'](" + arg + ");";
        getBridge().getWebView().post(() ->
            getBridge().getWebView().evaluateJavascript(js, null));
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    // ── Offline overlay ───────────────────────────────────────────────────────

    private void setupOfflineOverlay() {
        FrameLayout root = (FrameLayout) getWindow().getDecorView()
            .findViewById(android.R.id.content);

        offlineOverlay = LayoutInflater.from(this)
            .inflate(R.layout.view_offline, root, false);
        offlineOverlay.setVisibility(View.GONE);

        Button retry = offlineOverlay.findViewById(R.id.btnRetry);
        retry.setOnClickListener(v -> {
            if (isOnline()) {
                hideOfflineScreen();
                if (getBridge() != null && getBridge().getWebView() != null)
                    getBridge().getWebView().reload();
            }
        });

        root.addView(offlineOverlay);
    }

    private void showOfflineScreen() {
        runOnUiThread(() -> {
            if (offlineOverlay != null) offlineOverlay.setVisibility(View.VISIBLE);
        });
    }

    private void hideOfflineScreen() {
        runOnUiThread(() -> {
            if (offlineOverlay != null) offlineOverlay.setVisibility(View.GONE);
        });
    }

    // ── Network monitoring ────────────────────────────────────────────────────

    private ConnectivityManager.NetworkCallback networkCallback;
    private BroadcastReceiver                   legacyReceiver;

    private void startNetworkMonitoring() {
        ConnectivityManager cm =
            (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            networkCallback = new ConnectivityManager.NetworkCallback() {
                @Override public void onAvailable(Network network) {
                    if (wasOffline) {
                        wasOffline = false;
                        hideOfflineScreen();
                        if (getBridge() != null && getBridge().getWebView() != null)
                            runOnUiThread(() -> getBridge().getWebView().reload());
                    }
                }
                @Override public void onLost(Network network) {
                    if (!isOnline()) { wasOffline = true; showOfflineScreen(); }
                }
            };
            cm.registerDefaultNetworkCallback(networkCallback);
        } else {
            legacyReceiver = new BroadcastReceiver() {
                @Override public void onReceive(Context ctx, Intent intent) {
                    if (isOnline()) {
                        if (wasOffline) {
                            wasOffline = false;
                            hideOfflineScreen();
                            if (getBridge() != null && getBridge().getWebView() != null)
                                runOnUiThread(() -> getBridge().getWebView().reload());
                        }
                    } else { wasOffline = true; showOfflineScreen(); }
                }
            };
            registerReceiver(legacyReceiver,
                new IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION));
        }

        if (!isOnline()) { wasOffline = true; showOfflineScreen(); }
    }

    private boolean isOnline() {
        ConnectivityManager cm =
            (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Network net = cm.getActiveNetwork();
            if (net == null) return false;
            NetworkCapabilities caps = cm.getNetworkCapabilities(net);
            return caps != null &&
                (caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                 caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                 caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET));
        } else {
            android.net.NetworkInfo info = cm.getActiveNetworkInfo();
            return info != null && info.isConnected();
        }
    }

    // ── Deep Links ────────────────────────────────────────────────────────────

    private void handleDeepLink(Intent intent) {
        if (intent == null) return;
        Uri data = intent.getData();
        if (!Intent.ACTION_VIEW.equals(intent.getAction()) || data == null) return;
        String url = resolveDeepLinkUrl(data);
        if (url != null && getBridge() != null && getBridge().getWebView() != null) {
            final String finalUrl = url;
            getBridge().getWebView().post(() ->
                getBridge().getWebView().loadUrl(finalUrl));
        }
    }

    private String resolveDeepLinkUrl(Uri uri) {
        if ("https".equals(uri.getScheme()) && "mozosubz.xyz".equals(uri.getHost()))
            return uri.toString();
        if ("mozosubz".equals(uri.getScheme())) {
            String path  = uri.getPath();
            String query = uri.getQuery();
            String url   = BASE_URL + (path != null ? path : "");
            if (query != null) url += "?" + query;
            return url;
        }
        return null;
    }

    // ── Onboarding ────────────────────────────────────────────────────────────

    private boolean checkOnboarding() {
        SharedPreferences prefs = getSharedPreferences("mozosubz_prefs", MODE_PRIVATE);
        if (prefs.getBoolean("onboarding_done", false)) return false;
        Intent intent = new Intent(this, OnboardingActivity.class);
        if (getIntent() != null && getIntent().getData() != null)
            intent.putExtra("deep_link_url", getIntent().getDataString());
        startActivity(intent);
        finish();
        return true;
    }

    // ── Permissions ───────────────────────────────────────────────────────────

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED)
                ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.POST_NOTIFICATIONS},
                    NOTIF_PERMISSION_CODE);
        }
    }

    private void requestContactsPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_CONTACTS)
                != PackageManager.PERMISSION_GRANTED)
            ActivityCompat.requestPermissions(this,
                new String[]{Manifest.permission.READ_CONTACTS},
                CONTACTS_PERMISSION_CODE);
    }

    // ── WebView hardening ─────────────────────────────────────────────────────

    private void applyWebViewHardening() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT)
            WebView.setWebContentsDebuggingEnabled(false);
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView == null) return;
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setGeolocationEnabled(false);
        s.setSaveFormData(false);
        s.setSavePassword(false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) s.setSafeBrowsingEnabled(true);
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        webView.setHapticFeedbackEnabled(false);
    }
}
