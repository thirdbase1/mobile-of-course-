package com.mozosubz.app;

import android.os.Build;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;

/**
 * Extends Capacitor's BridgeWebViewClient to intercept WebView errors and
 * replace the browser's default error page with Mozosubz's branded error screen.
 * All navigation logic (allowNavigation, shouldOverrideUrlLoading, etc.) is
 * preserved by calling super.
 */
public class MozosubzWebViewClient extends BridgeWebViewClient {

    private final MainActivity activity;

    public MozosubzWebViewClient(Bridge bridge, MainActivity activity) {
        super(bridge);
        this.activity = activity;
    }

    // ── Android 6+ (API 23+) — detailed error object ──────────────────────────

    @Override
    public void onReceivedError(WebView view, WebResourceRequest request,
                                WebResourceError error) {
        super.onReceivedError(view, request, error);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                && request != null && request.isForMainFrame()) {
            int code = error.getErrorCode();
            if (code != WebViewClient.ERROR_CANCELLED) {
                activity.showWebError(view, code);
            }
        }
    }

    // ── Pre-API 23 fallback ────────────────────────────────────────────────────

    @SuppressWarnings("deprecation")
    @Override
    public void onReceivedError(WebView view, int errorCode,
                                String description, String failingUrl) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            super.onReceivedError(view, errorCode, description, failingUrl);
            if (errorCode != WebViewClient.ERROR_CANCELLED) {
                activity.showWebError(view, errorCode);
            }
        }
    }

    // ── HTTP-level errors (e.g. 5xx server down) ───────────────────────────────

    @Override
    public void onReceivedHttpError(WebView view, WebResourceRequest request,
                                    WebResourceResponse errorResponse) {
        super.onReceivedHttpError(view, request, errorResponse);
        if (request != null && request.isForMainFrame()
                && errorResponse.getStatusCode() >= 500) {
            // Use -999 as a sentinel for "server error"
            activity.showWebError(view, -999);
        }
    }
}
