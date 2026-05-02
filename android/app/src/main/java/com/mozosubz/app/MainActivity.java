package com.mozosubz.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String BASE_URL = "https://mozosubz.xyz";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);

        secureWindow();
        applyWebViewHardening();

        if (!checkOnboarding()) {
            handleDeepLink(getIntent());
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleDeepLink(intent);
    }

    private void handleDeepLink(Intent intent) {
        if (intent == null) return;

        String action = intent.getAction();
        Uri data = intent.getData();

        if (Intent.ACTION_VIEW.equals(action) && data != null) {
            String url = resolveDeepLinkUrl(data);
            if (url != null && getBridge() != null && getBridge().getWebView() != null) {
                final String finalUrl = url;
                getBridge().getWebView().post(() ->
                    getBridge().getWebView().loadUrl(finalUrl)
                );
            }
        }
    }

    private String resolveDeepLinkUrl(Uri uri) {
        String scheme = uri.getScheme();

        if ("https".equals(scheme) && "mozosubz.xyz".equals(uri.getHost())) {
            return uri.toString();
        }

        if ("mozosubz".equals(scheme)) {
            String path = uri.getPath();
            String query = uri.getQuery();
            String url = BASE_URL + (path != null ? path : "");
            if (query != null) url += "?" + query;
            return url;
        }

        return null;
    }

    private boolean checkOnboarding() {
        SharedPreferences prefs = getSharedPreferences("mozosubz_prefs", MODE_PRIVATE);
        boolean onboardingDone = prefs.getBoolean("onboarding_done", false);
        if (!onboardingDone) {
            Intent intent = new Intent(this, OnboardingActivity.class);
            if (getIntent() != null && getIntent().getData() != null) {
                intent.putExtra("deep_link_url", getIntent().getDataString());
            }
            startActivity(intent);
            finish();
            return true;
        }
        return false;
    }

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

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setGeolocationEnabled(false);
        settings.setSaveFormData(false);
        settings.setSavePassword(false);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(true);
        }

        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        webView.setHapticFeedbackEnabled(false);
    }
}
