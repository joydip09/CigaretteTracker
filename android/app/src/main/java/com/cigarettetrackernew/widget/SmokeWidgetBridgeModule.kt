package com.cigarettetrackernew.widget

import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.text.SimpleDateFormat
import java.util.*

/**
 * Native module that bridges widget data into React Native.
 * Call NativeModules.SmokeWidgetBridge.getPendingCount() from JS on app resume
 * to pick up any cigarettes logged via the widget.
 */
class SmokeWidgetBridgeModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "SmokeWidgetBridge"

    @ReactMethod
    fun getPendingCount(promise: Promise) {
        try {
            val bridge = reactContext.getSharedPreferences(
                "SmokeTrackerBridge", Context.MODE_PRIVATE
            )
            val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            val today = sdf.format(Date())
            val pendingDate = bridge.getString("pendingDate", "")
            val count = if (pendingDate == today) bridge.getInt("pendingCount", 0) else 0
            val cost = if (pendingDate == today) bridge.getFloat("pendingCost", 0f) else 0f

            val result = Arguments.createMap().apply {
                putInt("count", count)
                putDouble("cost", cost.toDouble())
                putString("date", today)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun syncSettings(pricePerStick: Double, currency: String) {
        try {
            val prefs = reactContext.getSharedPreferences(
                SmokeWidget.PREFS_NAME, Context.MODE_PRIVATE
            )
            prefs.edit()
                .putFloat(SmokeWidget.PREF_PRICE_PER_STICK, pricePerStick.toFloat())
                .putString(SmokeWidget.PREF_CURRENCY, currency)
                .apply()
            SmokeWidget.updateAllWidgets(reactContext)
        } catch (e: Exception) {
            // Silently fail
        }
    }

    @ReactMethod
    fun updateWidgetCount(count: Int, date: String) {
        try {
            val prefs = reactContext.getSharedPreferences(
                SmokeWidget.PREFS_NAME, Context.MODE_PRIVATE
            )
            prefs.edit().putInt("${SmokeWidget.PREF_COUNT_PREFIX}$date", count).apply()
            SmokeWidget.updateAllWidgets(reactContext)
        } catch (e: Exception) {
            // Silently fail
        }
    }
}
