package expo.modules.offscreenblocker

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
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

/**
 * Foreground service that watches which app is in front (via UsageStats events) and
 * raises [LockActivity] over locked apps while they are locked.
 */
class BlockerService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private var lastPoll = 0L
  private var foreground: String? = null
  private var shownFor: String? = null

  private val tick =
    object : Runnable {
      override fun run() {
        try {
          poll()
        } catch (_: Exception) {
          // Never let a transient failure (e.g. revoked usage access) kill the loop.
        }
        handler.postDelayed(this, POLL_MS)
      }
    }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (!BlockerStore.isEnabled(this)) {
      stopSelf()
      return START_NOT_STICKY
    }
    startInForeground()
    handler.removeCallbacks(tick)
    handler.post(tick)
    return START_STICKY
  }

  override fun onDestroy() {
    handler.removeCallbacks(tick)
    super.onDestroy()
  }

  private fun startInForeground() {
    val nm = getSystemService(NotificationManager::class.java)
    if (Build.VERSION.SDK_INT >= 26) {
      nm.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "App blocking", NotificationManager.IMPORTANCE_LOW)
      )
    }
    val open =
      packageManager.getLaunchIntentForPackage(packageName)?.let {
        PendingIntent.getActivity(this, 0, it, PendingIntent.FLAG_IMMUTABLE)
      }
    val builder =
      if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, CHANNEL_ID)
      else @Suppress("DEPRECATION") Notification.Builder(this)
    val notification =
      builder
        .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
        .setContentTitle("OffScreen is active")
        .setContentText("Locked apps are blocked until your tasks are done.")
        .setOngoing(true)
        .setContentIntent(open)
        .build()
    if (Build.VERSION.SDK_INT >= 34) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
  }

  @Suppress("DEPRECATION")
  private fun poll() {
    val usm = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val now = System.currentTimeMillis()
    // First poll looks back further to find whatever is already on screen.
    val from = if (lastPoll == 0L) now - INITIAL_LOOKBACK_MS else lastPoll - 1_000
    val events = usm.queryEvents(from, now)
    val e = UsageEvents.Event()
    while (events.hasNextEvent()) {
      events.getNextEvent(e)
      when (e.eventType) {
        UsageEvents.Event.MOVE_TO_FOREGROUND -> foreground = e.packageName
        UsageEvents.Event.MOVE_TO_BACKGROUND -> if (foreground == e.packageName) foreground = null
      }
    }
    lastPoll = now

    val pkg = foreground ?: return
    if (pkg == packageName) return // our own screens (incl. the lock) leave state untouched

    val locked = pkg in BlockerStore.lockedPackages(this) && !BlockerStore.isUnlockedToday(this)
    if (!locked) {
      shownFor = null
      return
    }
    if (shownFor == pkg) return
    shownFor = pkg
    BlockerStore.recordBlock(this)
    startActivity(
      Intent(this, LockActivity::class.java)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NO_ANIMATION)
        .putExtra(LockActivity.EXTRA_PACKAGE, pkg)
    )
  }

  companion object {
    private const val CHANNEL_ID = "offscreen_blocker"
    private const val NOTIFICATION_ID = 1001
    private const val POLL_MS = 400L
    private const val INITIAL_LOOKBACK_MS = 10 * 60_000L

    fun start(context: Context) {
      val intent = Intent(context, BlockerService::class.java)
      if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(intent)
      else context.startService(intent)
    }

    fun stop(context: Context) {
      context.stopService(Intent(context, BlockerService::class.java))
    }
  }
}
