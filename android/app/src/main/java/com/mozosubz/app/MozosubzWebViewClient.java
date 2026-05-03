package com.mozosubz.app;

import android.os.Build;
import android.util.DisplayMetrics;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;

/**
 * Extends Capacitor's BridgeWebViewClient to:
 * 1. Inject a safe-area <style> tag so the website's content respects the
 *    status bar and navigation bar heights (edge-to-edge layout).
 * 2. Inject the navigator.contacts polyfill after each page load.
 * 3. Intercept load errors → show branded error page instead of browser default.
 *
 * All navigation logic (allowNavigation, shouldOverrideUrlLoading, etc.) is
 * fully preserved via super calls.
 */
public class MozosubzWebViewClient extends BridgeWebViewClient {

    private final MainActivity activity;

    // Injected once per page load. Adds padding equal to the actual system bar
    // heights so website content is never hidden under the status bar or nav bar.
    // The style tag is keyed by id so multiple injections are idempotent.
    private static final String SAFE_AREA_JS_TEMPLATE =
        "(function(){" +
        "  var id='_mz_sa';" +
        "  if(document.getElementById(id))return;" +
        "  var s=document.createElement('style');" +
        "  s.id=id;" +
        "  s.textContent=" +
        "    'body{" +
        "      padding-top:%dpx!important;" +
        "      padding-bottom:%dpx!important;" +
        "      box-sizing:border-box!important" +
        "    }';" +
        "  (document.head||document.documentElement).appendChild(s);" +
        "})();";

    // JS polyfill — overrides navigator.contacts with a bridge to the Android
    // contact picker. Injected after every page load so the website's contact
    // button works natively without any changes to the website itself.
    private static final String CONTACTS_POLYFILL =
        "(function(){" +
        "  if(!window.MozosubzContacts)return;" +
        "  if(navigator.contacts&&navigator.contacts._mz)return;" +
        "  try{" +
        "    Object.defineProperty(navigator,'contacts',{" +
        "      configurable:true,writable:true," +
        "      value:{" +
        "        _mz:true," +
        "        select:function(props,opts){" +
        "          return new Promise(function(res,rej){" +
        "            var id='_mzc_'+Date.now()+'_'+Math.random().toString(36).slice(2);" +
        "            window[id]=function(json){" +
        "              delete window[id];" +
        "              if(json!=null){try{res([JSON.parse(json)]);}catch(e){rej(e);}}" +
        "              else{rej(new DOMException('AbortError','AbortError'));}" +
        "            };" +
        "            window.MozosubzContacts.pickContact(id,JSON.stringify(props||['name','tel']));" +
        "          });" +
        "        }" +
        "      }" +
        "    });" +
        "  }catch(e){console.warn('MozosubzContacts polyfill error:',e);}" +
        "})();";

    public MozosubzWebViewClient(Bridge bridge, MainActivity activity,
                                 Object ignored) {
        super(bridge);
        this.activity = activity;
    }

    // ── Page finished ─────────────────────────────────────────────────────────

    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);

        if (view != null) {
            // 1. Inject safe-area padding using actual window inset values
            injectSafeAreaPadding(view);

            // 2. Inject contacts polyfill
            view.evaluateJavascript(CONTACTS_POLYFILL, null);
        }
    }

    /**
     * Reads the current window insets (in physical px), converts to CSS px
     * (= dp for standard-viewport pages), and injects a <style> element that
     * pads the body so content sits inside the status bar / nav bar safe area.
     */
    private void injectSafeAreaPadding(WebView view) {
        int topDp = 0, bottomDp = 0;

        WindowInsetsCompat wi = ViewCompat.getRootWindowInsets(
            activity.getWindow().getDecorView());
        if (wi != null) {
            Insets bars = wi.getInsets(WindowInsetsCompat.Type.systemBars());
            float density = view.getContext().getResources()
                .getDisplayMetrics().density;
            topDp    = Math.round(bars.top    / density);
            bottomDp = Math.round(bars.bottom / density);
        }

        // Fallback: if insets not yet available, read system resources
        if (topDp == 0) {
            DisplayMetrics dm = view.getContext().getResources().getDisplayMetrics();
            int sbRes = view.getContext().getResources()
                .getIdentifier("status_bar_height", "dimen", "android");
            if (sbRes > 0)
                topDp = Math.round(
                    view.getContext().getResources().getDimensionPixelSize(sbRes)
                    / dm.density);
        }

        String js = String.format(SAFE_AREA_JS_TEMPLATE, topDp, bottomDp);
        view.evaluateJavascript(js, null);
    }

    // ── Android 6+ (API 23+) — detailed error object ──────────────────────────

    @Override
    public void onReceivedError(WebView view, WebResourceRequest request,
                                WebResourceError error) {
        super.onReceivedError(view, request, error);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                && request != null && request.isForMainFrame()) {
            int code = error.getErrorCode();
            if (code != -33 /* ERROR_CANCELLED */) {
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
            if (errorCode != -33 /* ERROR_CANCELLED */) {
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
            activity.showWebError(view, -999);
        }
    }
}
