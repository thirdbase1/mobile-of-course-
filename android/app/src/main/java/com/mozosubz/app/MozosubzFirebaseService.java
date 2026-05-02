package com.mozosubz.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

public class MozosubzFirebaseService extends FirebaseMessagingService {

    static final String CHANNEL_ID   = "mozosubz_main";
    static final String CHANNEL_NAME = "Mozosubz Notifications";

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        // Token refreshed — stored automatically by Firebase.
        // If you later add personalised notifications, send this token to your server here.
    }

    @Override
    public void onMessageReceived(RemoteMessage message) {
        super.onMessageReceived(message);

        String title    = getString(R.string.app_name);
        String body     = "";
        String clickUrl = null;

        // Notification payload (shown automatically when app is in background)
        if (message.getNotification() != null) {
            RemoteMessage.Notification n = message.getNotification();
            if (n.getTitle() != null) title = n.getTitle();
            if (n.getBody()  != null) body  = n.getBody();
        }

        // Data payload (always delivered, even in foreground)
        Map<String, String> data = message.getData();
        if (data.containsKey("title")) title    = data.get("title");
        if (data.containsKey("body"))  body     = data.get("body");
        if (data.containsKey("url"))   clickUrl = data.get("url");

        showNotification(title, body, clickUrl);
    }

    private void showNotification(String title, String body, String url) {
        ensureChannel();

        Intent intent;
        if (url != null && !url.isEmpty()) {
            intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        } else {
            intent = new Intent(this, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        }

        int flags = PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pi = PendingIntent.getActivity(this, 0, intent, flags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pi)
            .setColor(getResources().getColor(R.color.mozosubz_primary, getTheme()));

        NotificationManager nm =
            (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.notify((int) System.currentTimeMillis(), builder.build());
        }
    }

    static void ensureChannel(Context ctx) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("Mozosubz app notifications");
            ch.enableVibration(true);
            NotificationManager nm = ctx.getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(ch);
        }
    }

    private void ensureChannel() {
        ensureChannel(this);
    }
}
