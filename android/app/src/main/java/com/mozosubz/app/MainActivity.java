package com.mozosubz.app;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.FrameLayout;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String BASE_URL              = "https://mozosubz.xyz";
    private static final int    NOTIF_PERMISSION_CODE = 101;

    private View    offlineOverlay;
    private boolean wasOffline = false;

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);

        secureWindow();
        applyWebViewHardening();
        MozosubzFirebaseService.ensureChannel(this);
        requestNotificationPermission();
        setupOfflineOverlay();
        startNetworkMonitoring();

        if (!checkOnboarding()) {
            handleDeepLink(getIntent());
            new UpdateChecker(this).checkIfNeeded();
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleDeepLink(intent);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopNetworkMonitoring();
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
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().reload();
                }
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
                @Override
                public void onAvailable(Network network) {
                    if (wasOffline) {
                        wasOffline = false;
                        hideOfflineScreen();
                        if (getBridge() != null && getBridge().getWebView() != null) {
                            runOnUiThread(() -> getBridge().getWebView().reload());
                        }
                    }
                }
                @Override
                public void onLost(Network network) {
                    if (!isOnline()) {
                        wasOffline = true;
                        showOfflineScreen();
                    }
                }
            };
            cm.registerDefaultNetworkCallback(networkCallback);
        } else {
            legacyReceiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context ctx, Intent intent) {
                    if (isOnline()) {
                        if (wasOffline) {
                            wasOffline = false;
                            hideOfflineScreen();
                            if (getBridge() != null && getBridge().getWebView() != null) {
                                runOnUiThread(() -> getBridge().getWebView().reload());
                            }
                        }
                    } else {
                        wasOffline = true;
                        showOfflineScreen();
                    }
                }
            };
            IntentFilter filter = new IntentFilter(
                ConnectivityManager.CONNECTIVITY_ACTION);
            registerReceiver(legacyReceiver, filter);
        }

        // Check state right away
        if (!isOnline()) {
            wasOffline = true;
            showOfflineScreen();
        }
    }

    private void stopNetworkMonitoring() {
        ConnectivityManager cm =
            (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && networkCallback != null) {
            try { cm.unregisterNetworkCallback(networkCallback); } catch (Exception ignored) {}
        }
        if (legacyReceiver != null) {
            try { unregisterReceiver(legacyReceiver); } catch (Exception ignored) {}
        }
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
        if ("https".equals(uri.getScheme()) && "mozosubz.xyz".equals(uri.getHost())) {
            return uri.toString();
        }
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
        if (getIntent() != null && getIntent().getData() != null) {
            intent.putExtra("deep_link_url", getIntent().getDataString());
        }
        startActivity(intent);
        finish();
        return true;
    }

    // ── Notifications permission (Android 13+) ────────────────────────────────

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.POST_NOTIFICATIONS},
                    NOTIF_PERMISSION_CODE);
            }
        }
    }

    // ── Security ──────────────────────────────────────────────────────────────

    private void secureWindow() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
        }
        getWindow().setStatusBarColor(getColor(R.color.mozosubz_bg_dark));
        getWindow().setNavigationBarColor(getColor(R.color.mozosubz_bg_dark));
    }

    private void applyWebViewHardening() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(false);
        }
        WebView webView = getBridge().getWebView();
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
