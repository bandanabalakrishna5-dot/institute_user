package com.institute.user;

import android.Manifest;
import android.content.Intent;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(
    name = "BackgroundLocation",
    permissions = {
        @Permission(alias = "location", strings = {
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.ACCESS_FINE_LOCATION
        }),
        @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS })
    }
)
public class BackgroundLocationPlugin extends Plugin {
    @PluginMethod
    public void start(PluginCall call) {
        Integer driverId = call.getInt("driverId");
        String apiUrl = call.getString("apiUrl");
        if (driverId == null || driverId <= 0 || apiUrl == null || apiUrl.trim().isEmpty()) {
            call.reject("Driver ID and API URL are required.");
            return;
        }
        if (getPermissionState("location") != com.getcapacitor.PermissionState.GRANTED) {
            call.reject("Precise location permission is required.");
            return;
        }
        Intent intent = new Intent(getContext(), BackgroundLocationService.class);
        intent.putExtra("driverId", driverId);
        intent.putExtra("apiUrl", apiUrl);
        intent.putExtra("token", call.getString("token", ""));
        intent.putExtra("intervalMs", Math.max(8000L, call.getInt("intervalMs", 8000)));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) getContext().startForegroundService(intent);
        else getContext().startService(intent);
        call.resolve(new JSObject().put("active", true));
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getContext().stopService(new Intent(getContext(), BackgroundLocationService.class));
        call.resolve(new JSObject().put("active", false));
    }
}
