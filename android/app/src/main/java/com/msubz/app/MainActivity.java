package com.msubz.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);

        secureWindow();
        applyWebViewHardening();
        checkOnboarding();
    }

    private void checkOnboarding() {
        SharedPreferences prefs = getSharedPreferences("msubz_prefs", MODE_PRIVATE);
        boolean onboardingDone = prefs.getBoolean("onboarding_done", false);
        if (!onboardingDone) {
            startActivity(new Intent(this, OnboardingActivity.class));
            finish();
        }
    }

    private void secureWindow() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
        }
        getWindow().setStatusBarColor(getColor(R.color.msubz_bg_dark));
        getWindow().setNavigationBarColor(getColor(R.color.msubz_bg_dark));
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
