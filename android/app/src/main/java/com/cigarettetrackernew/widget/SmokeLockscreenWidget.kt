package com.cigarettetrackernew.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.cigarettetrackernew.R

/**
 * SmokeLockscreenWidget
 *
 * A minimal lock-screen widget with a single "+ Log Cigarette" button.
 * Shares all storage and sync logic with SmokeWidget via the companion object.
 *
 * Android lock-screen widgets are supported on API 17–20 natively.
 * On API 21+, Samsung/One UI and some OEMs still support keyguard widgets.
 * On stock Android 5+, use the notification shade or quick-settings tile as an alternative.
 */
class SmokeLockscreenWidget : AppWidgetProvider() {

    companion object {
        const val ACTION_LOG_FROM_LOCK = "com.cigarettetrackernew.ACTION_LOG_FROM_LOCK"

        fun updateAllWidgets(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(
                ComponentName(context, SmokeLockscreenWidget::class.java)
            )
            val intent = Intent(context, SmokeLockscreenWidget::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
            }
            context.sendBroadcast(intent)
        }
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (id in appWidgetIds) updateWidget(context, appWidgetManager, id)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_LOG_FROM_LOCK) {
            // Reuse SmokeWidget's increment — keeps counts in sync
            SmokeWidget.incrementCount(context)

            // Refresh both widget types
            val manager = AppWidgetManager.getInstance(context)
            val lockIds = manager.getAppWidgetIds(
                ComponentName(context, SmokeLockscreenWidget::class.java)
            )
            for (id in lockIds) updateWidget(context, manager, id)

            // Also refresh home screen widget
            SmokeWidget.updateAllWidgets(context)
        }
    }

    private fun updateWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        widgetId: Int
    ) {
        val count    = SmokeWidget.getTodayCount(context)
        val currency = SmokeWidget.getCurrency(context)
        val price    = SmokeWidget.getPricePerStick(context)
        val cost     = count * price

        val views = RemoteViews(context.packageName, R.layout.widget_lockscreen)

        // Count label: "7 today · ৳77"
        val label = if (count == 0) "0 today" else
            "$count today · $currency${"%.0f".format(cost)}"
        views.setTextViewText(R.id.lockscreen_count_label, label)

        // Log button tap → broadcast ACTION_LOG_FROM_LOCK
        val logIntent = Intent(context, SmokeLockscreenWidget::class.java).apply {
            action = ACTION_LOG_FROM_LOCK
        }
        val pendingLog = PendingIntent.getBroadcast(
            context, 10, logIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.lockscreen_log_button, pendingLog)

        appWidgetManager.updateAppWidget(widgetId, views)
    }
}
