package expo.modules.offscreenblocker

import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.os.Build
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
