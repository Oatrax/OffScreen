package expo.modules.offscreenblocker

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Restarts blocking after a reboot or an app update. */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (BlockerStore.isEnabled(context)) {
      try {
        BlockerService.start(context)
      } catch (_: Exception) {
        // Start can be refused on some OEM builds; the app will retry when opened.
      }
    }
  }
}
