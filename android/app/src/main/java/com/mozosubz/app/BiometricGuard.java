package com.mozosubz.app;

import android.content.Context;
import android.util.Log;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

/**
 * Wraps BiometricPrompt to show a fingerprint / Face ID gate on app open.
 *
 * Usage:
 *   BiometricGuard.check(this, () -> proceedNormally(), () -> finishApp());
 *
 * If the device has no biometric enrolled, onSuccess fires immediately so the
 * user is never blocked without a way forward.
 */
public class BiometricGuard {

    private static final String TAG = "BiometricGuard";

    public interface Callback {
        void onSuccess();
        void onCancel();
    }

    /**
     * Checks whether biometrics are available and enrolled, then either:
     *  - Shows the prompt (fingerprint / Face ID)
     *  - Calls onSuccess() directly if biometric isn't enrolled / unavailable
     */
    public static void check(FragmentActivity activity, Callback cb) {
        BiometricManager mgr = BiometricManager.from(activity);
        int canAuth = mgr.canAuthenticate(
            BiometricManager.Authenticators.BIOMETRIC_STRONG |
            BiometricManager.Authenticators.BIOMETRIC_WEAK);

        if (canAuth != BiometricManager.BIOMETRIC_SUCCESS) {
            // No biometric hardware or nothing enrolled — let the user through
            Log.d(TAG, "Biometric unavailable (code=" + canAuth + "), skipping lock");
            cb.onSuccess();
            return;
        }

        BiometricPrompt.AuthenticationCallback authCallback =
            new BiometricPrompt.AuthenticationCallback() {
                @Override
                public void onAuthenticationSucceeded(
                        BiometricPrompt.AuthenticationResult result) {
                    cb.onSuccess();
                }

                @Override
                public void onAuthenticationError(int errorCode, CharSequence msg) {
                    // User pressed "Exit App" or dismissed — close the app
                    Log.d(TAG, "Auth error " + errorCode + ": " + msg);
                    cb.onCancel();
                }

                @Override
                public void onAuthenticationFailed() {
                    // Wrong finger / face — BiometricPrompt handles retry UI natively
                    Log.d(TAG, "Auth failed (bad biometric), prompt will retry");
                }
            };

        BiometricPrompt prompt = new BiometricPrompt(
            activity,
            ContextCompat.getMainExecutor(activity),
            authCallback);

        BiometricPrompt.PromptInfo info = new BiometricPrompt.PromptInfo.Builder()
            .setTitle("Mozosubz")
            .setSubtitle("Verify your identity to continue")
            .setNegativeButtonText("Exit App")
            .setConfirmationRequired(false)   // immediate accept on face unlock
            .setAllowedAuthenticators(
                BiometricManager.Authenticators.BIOMETRIC_STRONG |
                BiometricManager.Authenticators.BIOMETRIC_WEAK)
            .build();

        prompt.authenticate(info);
    }
}
