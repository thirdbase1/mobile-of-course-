package com.mozosubz.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.AsyncTask;
import android.util.Log;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class UpdateChecker {

    private static final String TAG              = "UpdateChecker";
    private static final String PREF_LAST_CHECK  = "last_update_check";
    private static final long   INTERVAL_MS      = 24 * 60 * 60 * 1000L;
    private static final String RELEASES_API     =
        "https://api.github.com/repos/thirdbase1/mobile-of-course-/releases/latest";
    private static final String RELEASES_PAGE    =
        "https://github.com/thirdbase1/mobile-of-course-/releases/latest";

    private final Activity activity;

    public UpdateChecker(Activity activity) {
        this.activity = activity;
    }

    public void checkIfNeeded() {
        SharedPreferences prefs =
            activity.getSharedPreferences("mozosubz_prefs", Activity.MODE_PRIVATE);
        long lastCheck = prefs.getLong(PREF_LAST_CHECK, 0);
        if (System.currentTimeMillis() - lastCheck < INTERVAL_MS) return;

        prefs.edit().putLong(PREF_LAST_CHECK, System.currentTimeMillis()).apply();
        new FetchTask().execute();
    }

    private class FetchTask extends AsyncTask<Void, Void, String> {

        @Override
        protected String doInBackground(Void... voids) {
            try {
                HttpURLConnection conn =
                    (HttpURLConnection) new URL(RELEASES_API).openConnection();
                conn.setRequestProperty("Accept", "application/vnd.github+json");
                conn.setRequestProperty("User-Agent",
                    "MozosubzApp/" + BuildConfig.VERSION_NAME);
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(8000);
                if (conn.getResponseCode() != 200) return null;

                StringBuilder sb = new StringBuilder();
                try (BufferedReader br =
                    new BufferedReader(new InputStreamReader(conn.getInputStream()))) {
                    String line;
                    while ((line = br.readLine()) != null) sb.append(line);
                }
                return new JSONObject(sb.toString())
                    .getString("tag_name")
                    .replaceAll("[^0-9.]", "");

            } catch (Exception e) {
                Log.d(TAG, "Update check skipped: " + e.getMessage());
                return null;
            }
        }

        @Override
        protected void onPostExecute(String latest) {
            if (latest == null || activity.isFinishing()) return;
            if (isNewer(latest, BuildConfig.VERSION_NAME)) {
                showDialog(latest);
            }
        }
    }

    private static boolean isNewer(String latest, String current) {
        try {
            String[] l = latest.split("\\.");
            String[] c = current.split("\\.");
            int len = Math.max(l.length, c.length);
            for (int i = 0; i < len; i++) {
                int lv = i < l.length ? Integer.parseInt(l[i]) : 0;
                int cv = i < c.length ? Integer.parseInt(c[i]) : 0;
                if (lv > cv) return true;
                if (lv < cv) return false;
            }
        } catch (Exception ignored) {}
        return false;
    }

    private void showDialog(String version) {
        activity.runOnUiThread(() -> {
            if (activity.isFinishing()) return;
            new AlertDialog.Builder(activity)
                .setTitle("Update Available — v" + version)
                .setMessage(
                    "A new version of Mozosubz is ready. Update now to get the latest " +
                    "features, bug fixes, and security improvements.")
                .setPositiveButton("Update Now", (d, w) ->
                    activity.startActivity(
                        new Intent(Intent.ACTION_VIEW, Uri.parse(RELEASES_PAGE))))
                .setNegativeButton("Later", null)
                .setCancelable(true)
                .show();
        });
    }
}
