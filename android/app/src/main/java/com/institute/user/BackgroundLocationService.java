package com.institute.user;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class BackgroundLocationService extends Service implements LocationListener {
    private static final String CHANNEL_ID = "live_bus_tracking";
    private static final int NOTIFICATION_ID = 8108;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ExecutorService networkExecutor = Executors.newSingleThreadExecutor();
    private LocationManager locationManager;
    private Location latestLocation;
    private int driverId;
    private String apiUrl;
    private String token;
    private long intervalMs = 8000L;
    private boolean requestInFlight;

    private final Runnable publisher = new Runnable() {
        @Override public void run() {
            if (latestLocation != null && !requestInFlight) postLocation(latestLocation, 1);
            handler.postDelayed(this, intervalMs);
        }
    };

    @Override public void onCreate() {
        super.onCreate();
        locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
        createNotificationChannel();
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        driverId = intent.getIntExtra("driverId", 0);
        apiUrl = intent.getStringExtra("apiUrl");
        token = intent.getStringExtra("token");
        intervalMs = Math.max(8000L, intent.getLongExtra("intervalMs", 8000L));
        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pending = PendingIntent.getActivity(this, 0, launch,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        NotificationCompat.Builder notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("Live bus tracking active")
            .setContentText("Location is securely saved every 8 seconds")
            .setOngoing(true).setOnlyAlertOnce(true).setContentIntent(pending)
            .setCategory(NotificationCompat.CATEGORY_SERVICE).setPriority(NotificationCompat.PRIORITY_LOW);
        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
            ? ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION : 0;
        ServiceCompat.startForeground(this, NOTIFICATION_ID, notification.build(), type);
        startLocationUpdates();
        handler.removeCallbacks(publisher);
        handler.post(publisher);
        return START_REDELIVER_INTENT;
    }

    @SuppressWarnings("MissingPermission")
    private void startLocationUpdates() {
        locationManager.removeUpdates(this);
        if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER))
            locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 2000L, 0f, this);
        if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER))
            locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 4000L, 0f, this);
    }

    @Override public void onLocationChanged(Location location) {
        if (latestLocation == null || location.getTime() >= latestLocation.getTime()) latestLocation = location;
    }
    @Override public void onStatusChanged(String provider, int status, Bundle extras) {}
    @Override public void onProviderEnabled(String provider) {}
    @Override public void onProviderDisabled(String provider) {}

    private void postLocation(Location location, int status) {
        requestInFlight = true;
        networkExecutor.execute(() -> {
            HttpURLConnection connection = null;
            try {
                JSONObject body = new JSONObject();
                body.put("drvid", driverId);
                body.put("latitude", location.getLatitude());
                body.put("longitude", location.getLongitude());
                body.put("gpssts", status);
                body.put("accuracy", location.getAccuracy());
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                    body.put("capturedAt", Instant.ofEpochMilli(location.getTime()).toString());
                byte[] bytes = body.toString().getBytes(StandardCharsets.UTF_8);
                connection = (HttpURLConnection) new URL(apiUrl).openConnection();
                connection.setRequestMethod("POST");
                connection.setConnectTimeout(10000);
                connection.setReadTimeout(10000);
                connection.setDoOutput(true);
                connection.setRequestProperty("Content-Type", "application/json");
                if (token != null && !token.isEmpty()) {
                    connection.setRequestProperty("Authorization", "Bearer " + token);
                    connection.setRequestProperty("x-access-token", token);
                }
                try (OutputStream output = connection.getOutputStream()) { output.write(bytes); }
                connection.getResponseCode();
            } catch (Exception ignored) {
                // The next 8-second cycle retries with the newest position.
            } finally {
                if (connection != null) connection.disconnect();
                requestInFlight = false;
            }
        });
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(CHANNEL_ID,
            "Live bus tracking", NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("Required while sharing the driver's live bus location");
        getSystemService(NotificationManager.class).createNotificationChannel(channel);
    }

    @Override public void onDestroy() {
        handler.removeCallbacks(publisher);
        if (locationManager != null) locationManager.removeUpdates(this);
        if (latestLocation != null) postLocation(latestLocation, 0);
        networkExecutor.shutdown();
        super.onDestroy();
    }

    @Nullable @Override public IBinder onBind(Intent intent) { return null; }
}
