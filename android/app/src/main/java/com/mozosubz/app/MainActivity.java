package com.mozosubz.app;

import android.Manifest;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String BASE_URL = "https://mozosubz.xyz";
    private static final int    NOTIF_PERMISSION_CODE = 101;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);

        secureWindow();
        applyWebViewHardening();
        MozosubzFirebaseService.ensureChannel(this);
        requestNotificationPermission();

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
