package com.cigarettetrackernew.widget

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.cigarettetrackernew.R
import java.text.SimpleDateFormat
import java.util.*

class SmokeWidget : AppWidgetProvider() {

    companion object {
        const val ACTION_LOG_CIGARETTE  = "com.cigarettetrackernew.ACTION_LOG_CIGARETTE"
        const val ACTION_UNDO_CIGARETTE = "com.cigarettetrackernew.ACTION_UNDO_CIGARETTE"
        const val ACTION_UNDO_EXPIRED   = "com.cigarettetrackernew.ACTION_UNDO_EXPIRED"
        const val PREFS_NAME            = "SmokeTrackerWidget"
        const val PREF_COUNT_PREFIX     = "count_"
        const val PREF_PRICE_PER_STICK  = "price_per_stick"
        const val PREF_CURRENCY         = "currency"
        const val PREF_LAST_LOG_TIME    = "last_log_time"
        const val PREF_UNDO_USED        = "undo_used"
        const val UNDO_WINDOW_MS        = 3 * 60 * 1000L // 3 minutes

        fun getTodayKey(): String =
            PREF_COUNT_PREFIX + SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())

        fun getTodayCount(context: Context): Int =
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .getInt(getTodayKey(), 0)

        fun incrementCount(context: Context): Int {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val newCount = prefs.getInt(getTodayKey(), 0) + 1
            prefs.edit()
                .putInt(getTodayKey(), newCount)
                .putLong(PREF_LAST_LOG_TIME, System.currentTimeMillis())
                .putBoolean(PREF_UNDO_USED, false)
                .apply()
            syncToAsyncStorage(context, newCount)
            scheduleUndoExpiry(context)
            return newCount
        }

        fun decrementCount(context: Context): Int {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val current = prefs.getInt(getTodayKey(), 0)
            if (current <= 0) return 0
            val newCount = current - 1
            prefs.edit()
                .putInt(getTodayKey(), newCount)
                .putBoolean(PREF_UNDO_USED, true)
                .putLong(PREF_LAST_LOG_TIME, 0L)
                .apply()
            syncToAsyncStorage(context, newCount)
            return newCount
        }

        fun canUndo(context: Context): Boolean {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            if (prefs.getBoolean(PREF_UNDO_USED, false)) return false
            val lastLog = prefs.getLong(PREF_LAST_LOG_TIME, 0L)
            if (lastLog == 0L) return false
            return (System.currentTimeMillis() - lastLog) < UNDO_WINDOW_MS
        }

        fun isUndoExpired(context: Context): Boolean {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val lastLog = prefs.getLong(PREF_LAST_LOG_TIME, 0L)
            if (lastLog == 0L) return false
            val undoUsed = prefs.getBoolean(PREF_UNDO_USED, false)
            if (undoUsed) return false
            return (System.currentTimeMillis() - lastLog) >= UNDO_WINDOW_MS
        }

        fun getRemainingSeconds(context: Context): Int {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val lastLog = prefs.getLong(PREF_LAST_LOG_TIME, 0L)
            if (lastLog == 0L) return 0
            val remaining = UNDO_WINDOW_MS - (System.currentTimeMillis() - lastLog)
            return if (remaining > 0) Math.ceil(remaining / 1000.0).toInt() else 0
        }

        fun formatTime(secs: Int): String {
            val m = secs / 60
            val s = secs % 60
            return "$m:${s.toString().padStart(2, '0')}"
        }

        /** Schedule a broadcast when undo window closes so widget updates to locked state */
        fun scheduleUndoExpiry(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(context, SmokeWidget::class.java).apply {
                action = ACTION_UNDO_EXPIRED
            }
            val pi = PendingIntent.getBroadcast(
                context, 99, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val lastLog = prefs.getLong(PREF_LAST_LOG_TIME, System.currentTimeMillis())
            alarmManager.setExact(AlarmManager.RTC, lastLog + UNDO_WINDOW_MS, pi)
        }

        fun getPricePerStick(context: Context): Float =
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .getFloat(PREF_PRICE_PER_STICK, 11.0f)

        fun getCurrency(context: Context): String =
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .getString(PREF_CURRENCY, "৳") ?: "৳"

        private fun syncToAsyncStorage(context: Context, newCount: Int) {
            try {
                val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
                val cost = newCount * getPricePerStick(context)
                context.getSharedPreferences("SmokeTrackerBridge", Context.MODE_PRIVATE)
                    .edit()
                    .putInt("pendingCount", newCount)
                    .putString("pendingDate", today)
                    .putFloat("pendingCost", cost)
                    .apply()
            } catch (e: Exception) { e.printStackTrace() }
        }

        fun updateAllWidgets(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, SmokeWidget::class.java))
            val intent = Intent(context, SmokeWidget::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
            }
            context.sendBroadcast(intent)
        }
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (id in appWidgetIds) updateWidget(context, appWidgetManager, id)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        val manager = AppWidgetManager.getInstance(context)
        val ids = manager.getAppWidgetIds(ComponentName(context, SmokeWidget::class.java))

        when (intent.action) {
            ACTION_LOG_CIGARETTE -> {
                incrementCount(context)
                for (id in ids) updateWidget(context, manager, id)
            }
            ACTION_UNDO_CIGARETTE -> {
                if (canUndo(context)) {
                    decrementCount(context)
                    for (id in ids) updateWidget(context, manager, id)
                }
            }
            ACTION_UNDO_EXPIRED -> {
                // Just refresh so widget shows lock icon
                for (id in ids) updateWidget(context, manager, id)
            }
        }
    }

    private fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, widgetId: Int) {
        val count      = getTodayCount(context)
        val price      = getPricePerStick(context)
        val currency   = getCurrency(context)
        val totalCost  = count * price
        val canUndoNow = canUndo(context)
        val expired    = isUndoExpired(context)
        val secsLeft   = getRemainingSeconds(context)

        val views = RemoteViews(context.packageName, R.layout.widget_smoke)

        // Counter
        views.setTextViewText(R.id.widget_count, count.toString())
        views.setTextViewText(R.id.widget_cost, "$currency${"%.0f".format(totalCost)}")
        views.setTextViewText(R.id.widget_label, if (count == 1) "cigarette today" else "cigarettes today")

        // ── Undo button visibility ──
        when {
            canUndoNow -> {
                views.setViewVisibility(R.id.widget_undo_active_content,  android.view.View.VISIBLE)
                views.setViewVisibility(R.id.widget_undo_expired_content, android.view.View.GONE)
                views.setTextViewText(R.id.widget_undo_timer, formatTime(secsLeft))
            }
            expired -> {
                views.setViewVisibility(R.id.widget_undo_active_content,  android.view.View.GONE)
                views.setViewVisibility(R.id.widget_undo_expired_content, android.view.View.VISIBLE)
            }
            else -> {
                // No pending undo — hide both
                views.setViewVisibility(R.id.widget_undo_active_content,  android.view.View.GONE)
                views.setViewVisibility(R.id.widget_undo_expired_content, android.view.View.GONE)
            }
        }

        // ── Pending intents ──
        // Log button
        val logIntent = Intent(context, SmokeWidget::class.java).apply { action = ACTION_LOG_CIGARETTE }
        views.setOnClickPendingIntent(R.id.widget_add_button,
            PendingIntent.getBroadcast(context, 0, logIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))

        // Undo button
        val undoIntent = Intent(context, SmokeWidget::class.java).apply { action = ACTION_UNDO_CIGARETTE }
        views.setOnClickPendingIntent(R.id.widget_undo_button,
            PendingIntent.getBroadcast(context, 1, undoIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))

        // Open app on counter tap
        context.packageManager.getLaunchIntentForPackage(context.packageName)?.let { openIntent ->
            views.setOnClickPendingIntent(R.id.widget_counter_area,
                PendingIntent.getActivity(context, 2, openIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))
        }

        appWidgetManager.updateAppWidget(widgetId, views)
    }
}
