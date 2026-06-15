package com.matwaibel.arise.systemguard

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper

class SystemGuardService : Service() {
  companion object {
    const val ACTION_START = "START"
    const val ACTION_STOP = "STOP"
    const val EXTRA_PACKAGES = "packages"
    private const val CHANNEL_ID = "system_guard"
    private const val NOTIF_ID = 9911
    private const val POLL_MS = 1500L
  }

  private val handler = Handler(Looper.getMainLooper())
  private var sealed: Set<String> = emptySet()
  private var lastForeground: String? = null
  private var lastQueryTs = System.currentTimeMillis()
  private val overlay by lazy { GuardOverlay(this) }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_STOP -> {
        stopPolling()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
        return START_NOT_STICKY
      }
      else -> {
        sealed = intent?.getStringArrayListExtra(EXTRA_PACKAGES)?.toSet() ?: emptySet()
        startInForeground()
        startPolling()
      }
    }
    return START_STICKY
  }

  private fun startInForeground() {
    val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      nm.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "Sistema", NotificationManager.IMPORTANCE_LOW),
      )
    }
    val notif = Notification.Builder(this, CHANNEL_ID)
      .setContentTitle("O Sistema está vigiando")
      .setContentText("Apps selados monitorados durante a penalidade.")
      .setSmallIcon(applicationInfo.icon)
      .setOngoing(true)
      .build()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startForeground(NOTIF_ID, notif, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    } else {
      startForeground(NOTIF_ID, notif)
    }
  }

  private val poll = object : Runnable {
    override fun run() {
      detectForeground()?.let { pkg ->
        if (pkg != lastForeground) {
          lastForeground = pkg
          if (pkg in sealed) {
            SystemGuardModule.instance?.emitSealedAppOpened(pkg, System.currentTimeMillis())
            overlay.show()
          } else {
            overlay.hide()
          }
        }
      }
      handler.postDelayed(this, POLL_MS)
    }
  }

  private fun startPolling() {
    handler.removeCallbacks(poll)
    handler.post(poll)
  }

  private fun stopPolling() {
    handler.removeCallbacks(poll)
    overlay.hide()
  }

  private fun detectForeground(): String? {
    val usm = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val now = System.currentTimeMillis()
    val events = usm.queryEvents(lastQueryTs - 2000, now)
    lastQueryTs = now
    val e = UsageEvents.Event()
    var pkg: String? = null
    while (events.hasNextEvent()) {
      events.getNextEvent(e)
      if (e.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND) pkg = e.packageName
    }
    return pkg
  }

  override fun onDestroy() {
    stopPolling()
    super.onDestroy()
  }
}
