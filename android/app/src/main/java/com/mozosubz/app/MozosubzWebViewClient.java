package com.mozosubz.app;

import android.os.Build;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;

/**
 * Extends Capacitor's BridgeWebViewClient to:
 * 1. Stop the pull-to-refresh spinner when the page finishes loading.
 * 2. Inject the navigator.contacts polyfill after each page load.
 * 3. Intercept load errors → show branded error page instead of browser default.
 *
 * All navigation logic (allowNavigation, shouldOverrideUrlLoading, etc.) is
 * fully preserved via super calls.
 */
public class MozosubzWebViewClient extends BridgeWebViewClient {

    private final MainActivity       activity;
    private final SwipeRefreshLayout swipeRefresh;

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
                                 SwipeRefreshLayout swipeRefresh) {
        super(bridge);
        this.activity     = activity;
        this.swipeRefresh = swipeRefresh;
    }

    // ── Page finished: stop refresh spinner + inject contacts polyfill ────────

    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        // Stop the pull-to-refresh spinner (safe to call even if not refreshing)
        if (swipeRefresh != null) {
            swipeRefresh.post(() -> swipeRefresh.setRefreshing(false));
        }
        // Inject contacts polyfill so navigator.contacts works on the website
        if (view != null) {
            view.evaluateJavascript(CONTACTS_POLYFILL, null);
        }
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
                if (swipeRefresh != null)
                    swipeRefresh.post(() -> swipeRefresh.setRefreshing(false));
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
                if (swipeRefresh != null)
                    swipeRefresh.post(() -> swipeRefresh.setRefreshing(false));
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
            if (swipeRefresh != null)
                swipeRefresh.post(() -> swipeRefresh.setRefreshing(false));
            activity.showWebError(view, -999);
        }
    }
}
