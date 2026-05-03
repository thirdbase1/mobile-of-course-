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
import android.graphics.Color;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.ContactsContract;
import android.util.Log;
import android.view.HapticFeedbackConstants;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
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
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String TAG                      = "MozosubzMain";
    private static final String BASE_URL                 = "https://mozosubz.xyz";
    private static final int    NOTIF_PERMISSION_CODE    = 101;
    private static final int    CONTACTS_PERMISSION_CODE = 102;

    private SwipeRefreshLayout swipeRefreshLayout;
    private View               offlineOverlay;
    private boolean            wasOffline = false;

    private ActivityResultLauncher<Intent> contactPickerLauncher;
    private volatile String                pendingContactCallbackId;

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);

        contactPickerLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            this::onContactPickerResult);

        // Transparent bars — edge-to-edge
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().getDecorView().post(this::goImmersive);

        // Wrap Capacitor's WebView in SwipeRefreshLayout (also sets our WebViewClient)
        setupSwipeRefresh();

        // Expose contacts bridge to JS as window.MozosubzContacts
        getBridge().getWebView().addJavascriptInterface(
            new ContactsPickerBridge(this), "MozosubzContacts");

        applyWebViewHardening();
        MozosubzFirebaseService.ensureChannel(this);
        requestNotificationPermission();
        requestContactsPermission();
        setupOfflineOverlay();
        startNetworkMonitoring();

        if (!checkOnboarding()) {
            handleDeepLink(getIntent());
            new UpdateChecker(this).checkIfNeeded();
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) goImmersive();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleDeepLink(intent);
    }

    // ── Full-screen / Immersive ───────────────────────────────────────────────

    private void goImmersive() {
        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.hide(WindowInsetsCompat.Type.statusBars()
                      | WindowInsetsCompat.Type.navigationBars());
        controller.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }

    // ── Pull-to-Refresh ───────────────────────────────────────────────────────

    private void setupSwipeRefresh() {
        WebView webView = getBridge().getWebView();
        ViewGroup parent = (ViewGroup) webView.getParent();
        if (parent == null) return;

        int index = parent.indexOfChild(webView);
        ViewGroup.LayoutParams wvParams = webView.getLayoutParams();
        parent.removeViewAt(index);

        swipeRefreshLayout = new SwipeRefreshLayout(this) {
            @Override
            public boolean canChildScrollUp() {
                return webView.canScrollVertically(-1);
            }
        };

        swipeRefreshLayout.setLayoutParams(wvParams != null ? wvParams :
            new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        swipeRefreshLayout.addView(webView,
            new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        parent.addView(swipeRefreshLayout, index);

        swipeRefreshLayout.setProgressBackgroundColorSchemeColor(0xFF0B1120);
        swipeRefreshLayout.setColorSchemeColors(0xFF0066FF, 0xFFFFFFFF);

        swipeRefreshLayout.setOnRefreshListener(() -> {
            hapticTap();
            webView.reload();
        });

        getBridge().getWebView().setWebViewClient(
            new MozosubzWebViewClient(getBridge(), this, swipeRefreshLayout));
    }

    // ── Haptic feedback ───────────────────────────────────────────────────────

    private void hapticTap() {
        View v = getWindow().getDecorView();
        v.setHapticFeedbackEnabled(true);
        v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY,
            HapticFeedbackConstants.FLAG_IGNORE_GLOBAL_SETTING);
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

    public void launchContactPicker(String callbackId) {
        pendingContactCallbackId = callbackId;
        runOnUiThread(() -> {
            try {
                contactPickerLauncher.launch(new Intent(Intent.ACTION_PICK,
                    ContactsContract.Contacts.CONTENT_URI));
            } catch (Exception e) {
                Log.e(TAG, "launchContactPicker: " + e.getMessage());
                deliverContactToJs(callbackId, null);
            }
        });
    }

    private void onContactPickerResult(ActivityResult result) {
        String callbackId = pendingContactCallbackId;
        pendingContactCallbackId = null;
        if (callbackId == null) return;
        String json = null;
        if (result.getResultCode() == RESULT_OK && result.getData() != null)
            json = readContact(result.getData().getData());
        deliverContactToJs(callbackId, json);
    }

    private String readContact(Uri contactUri) {
        if (contactUri == null) return null;
        ContentResolver cr = getContentResolver();
        try (Cursor c = cr.query(contactUri, null, null, null, null)) {
            if (c == null || !c.moveToFirst()) return null;
            String name = c.getString(
                c.getColumnIndexOrThrow(ContactsContract.Contacts.DISPLAY_NAME));
            String id = c.getString(
                c.getColumnIndexOrThrow(ContactsContract.Contacts._ID));
            StringBuilder phones = new StringBuilder();
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
                        if (!first) phones.append(',');
                        phones.append('"').append(escapeJson(num.trim())).append('"');
                        first = false;
                    }
                }
            }
            return "{\"name\":[\"" + escapeJson(name) + "\"]," +
                   "\"tel\":[" + phones + "],\"email\":[],\"address\":[]}";
        } catch (Exception e) {
            Log.e(TAG, "readContact: " + e.getMessage());
            return null;
        }
    }

    private void deliverContactToJs(String callbackId, String json) {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        String arg = json != null ? "'" + json.replace("'", "\\'") + "'" : "null";
        String js  = "if(typeof window['" + callbackId + "']==='function')" +
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
        runOnUiThread(() -> { if (offlineOverlay != null) offlineOverlay.setVisibility(View.VISIBLE); });
    }

    private void hideOfflineScreen() {
        runOnUiThread(() -> { if (offlineOverlay != null) offlineOverlay.setVisibility(View.GONE); });
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
            getBridge().getWebView().post(() -> getBridge().getWebView().loadUrl(finalUrl));
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
