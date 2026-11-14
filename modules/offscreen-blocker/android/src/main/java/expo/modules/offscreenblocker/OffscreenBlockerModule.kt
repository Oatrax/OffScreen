package expo.modules.offscreenblocker

import android.app.AppOpsManager
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.os.Process
import android.provider.Settings
import android.util.Base64
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream

class OffscreenBlockerModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("OffscreenBlocker")

    // Async functions run off the main thread.
    AsyncFunction("getInstalledApps") { listInstalledApps() }

    AsyncFunction("getAppIcon") { packageName: String -> loadIconBase64(packageName) }

    Function("getPermissionStatus") {
      mapOf(
        "usageAccess" to hasUsageAccess(),
        "overlay" to Settings.canDrawOverlays(context),
        "notifications" to notificationsEnabled(),
        "battery" to
          (context.getSystemService(Context.POWER_SERVICE) as PowerManager)
            .isIgnoringBatteryOptimizations(context.packageName),
      )
    }

    Function("setLockedPackages") { packages: List<String> ->
      BlockerStore.setLockedPackages(context, packages)
    }

    /** [day] is the local date (YYYY-MM-DD) the PIN was issued for. */
    Function("setPin") { pin: String, day: String -> BlockerStore.setPin(context, pin, day) }

    /** Tasks incomplete -> re-lock. Complete + autoUnlock -> unlock for today. */
    Function("applyTaskState") { complete: Boolean, autoUnlock: Boolean ->
      if (!complete) BlockerStore.setUnlockedToday(context, false)
      else if (autoUnlock) BlockerStore.setUnlockedToday(context, true)
    }

    Function("startBlocking") {
      BlockerStore.setEnabled(context, true)
      BlockerService.start(context)
    }

    Function("stopBlocking") {
      BlockerStore.setEnabled(context, false)
      BlockerService.stop(context)
    }

    Function("getBlockStats") { BlockerStore.blockStats(context) }

    Function("openPermissionSettings") { kind: String -> openPermissionSettings(kind) }
  }

  private fun hasUsageAccess(): Boolean {
    val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode =
      if (Build.VERSION.SDK_INT >= 29) {
        appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
      } else {
        @Suppress("DEPRECATION")
        appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
      }
    return mode == AppOpsManager.MODE_ALLOWED
  }

  private fun notificationsEnabled(): Boolean =
    (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).areNotificationsEnabled()

  /** Opens the system screen where the user grants [kind]: usageAccess | overlay | notifications. */
  private fun openPermissionSettings(kind: String) {
    val pkgUri = Uri.parse("package:${context.packageName}")
    val primary =
      when (kind) {
        "usageAccess" -> Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS, pkgUri)
        "overlay" -> Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, pkgUri)
        "notifications" ->
          Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
            .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
        "battery" -> Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
        else -> throw IllegalArgumentException("Unknown permission: $kind")
      }
    val fallback =
      if (kind == "usageAccess") Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
      else Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, pkgUri)
    try {
      context.startActivity(primary.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    } catch (_: Exception) {
      // Some OEMs reject the package-scoped intent; fall back to the generic screen.
      context.startActivity(fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
  }

  /**
   * User-facing apps: anything with a launcher entry, excluding this app and core system apps.
   * System apps that were updated from the store (e.g. YouTube, Chrome) are kept because
   * they are the usual distraction targets.
   */
  private fun listInstalledApps(): List<Map<String, Any>> {
    val pm = context.packageManager
    val launcher = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
    val resolved =
      if (Build.VERSION.SDK_INT >= 33) {
        pm.queryIntentActivities(launcher, PackageManager.ResolveInfoFlags.of(0))
      } else {
        @Suppress("DEPRECATION") pm.queryIntentActivities(launcher, 0)
      }

    return resolved
      .mapNotNull { info ->
        val app = info.activityInfo.applicationInfo
        if (app.packageName == context.packageName) return@mapNotNull null
        val isSystem = (app.flags and ApplicationInfo.FLAG_SYSTEM) != 0
        val isUpdatedSystem = (app.flags and ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) != 0
        if (isSystem && !isUpdatedSystem) return@mapNotNull null
        mapOf<String, Any>(
          "packageName" to app.packageName,
          "label" to info.loadLabel(pm).toString(),
          "isSystem" to isSystem,
        )
      }
      .distinctBy { it["packageName"] }
      .sortedBy { (it["label"] as String).lowercase() }
  }

  /** App icon as a base64-encoded PNG (no data: prefix), or null if the app is gone. */
  private fun loadIconBase64(packageName: String): String? {
    return try {
      val drawable = context.packageManager.getApplicationIcon(packageName)
      val size = ICON_SIZE_PX
      val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
      val canvas = Canvas(bitmap)
      drawable.setBounds(0, 0, size, size)
      drawable.draw(canvas)
      val out = ByteArrayOutputStream()
      bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
      Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
    } catch (_: PackageManager.NameNotFoundException) {
      null
    }
  }

  private companion object {
    const val ICON_SIZE_PX = 96
  }
}
