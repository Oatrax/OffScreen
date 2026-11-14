package expo.modules.offscreenblocker

import android.content.Context
import android.content.SharedPreferences
import java.security.MessageDigest
import java.security.SecureRandom
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/** Process-wide blocker state shared by the Expo module, the service and the lock screen. */
object BlockerStore {
  private const val MAX_ATTEMPTS = 5
  private const val LOCKOUT_MS = 30_000L

  private fun prefs(c: Context): SharedPreferences =
    c.applicationContext.getSharedPreferences("offscreen_blocker", Context.MODE_PRIVATE)

  fun today(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

  fun lockedPackages(c: Context): Set<String> =
    prefs(c).getStringSet("locked", emptySet())?.toSet() ?: emptySet()

  fun setLockedPackages(c: Context, packages: Collection<String>) =
    prefs(c).edit().putStringSet("locked", HashSet(packages)).apply()

  fun isEnabled(c: Context) = prefs(c).getBoolean("enabled", false)

  fun setEnabled(c: Context, value: Boolean) = prefs(c).edit().putBoolean("enabled", value).apply()

  /** Apps are unlocked while this equals today's date, so they re-lock at midnight automatically. */
  fun isUnlockedToday(c: Context) = prefs(c).getString("unlocked_day", "") == today()

  fun setUnlockedToday(c: Context, unlocked: Boolean) =
    prefs(c).edit().putString("unlocked_day", if (unlocked) today() else "").apply()

  // ---- PIN (salted SHA-256; the plain PIN lives only in the app's SecureStore) ----

  fun setPin(c: Context, pin: String, day: String) {
    val salt = ByteArray(16).also { SecureRandom().nextBytes(it) }
    prefs(c).edit()
      .putString("pin_salt", salt.toHex())
      .putString("pin_hash", hash(salt, pin))
      .putString("pin_day", day)
      .apply()
  }

  /** True when [candidate] matches today's PIN. A PIN issued on an earlier day never matches. */
  fun verifyPin(c: Context, candidate: String): Boolean {
    val p = prefs(c)
    if (p.getString("pin_day", "") != today()) return false
    val salt = p.getString("pin_salt", null)?.fromHex() ?: return false
    return hash(salt, candidate) == p.getString("pin_hash", null)
  }

  /** True when the issued PIN is stale and the user has to open OffScreen to get a new one. */
  fun pinIsStale(c: Context) = prefs(c).getString("pin_day", "") != today()

  /** Remaining lockout in ms, or 0. */
  fun lockoutRemaining(c: Context): Long =
    (prefs(c).getLong("lockout_until", 0L) - System.currentTimeMillis()).coerceAtLeast(0L)

  /** Records a wrong attempt; returns true if it triggered a lockout. */
  fun recordFailedAttempt(c: Context): Boolean {
    val p = prefs(c)
    val fails = p.getInt("fails", 0) + 1
    return if (fails >= MAX_ATTEMPTS) {
      p.edit().putInt("fails", 0).putLong("lockout_until", System.currentTimeMillis() + LOCKOUT_MS).apply()
      true
    } else {
      p.edit().putInt("fails", fails).apply()
      false
    }
  }

  fun clearFailedAttempts(c: Context) = prefs(c).edit().putInt("fails", 0).apply()

  // ---- Stats ----

  fun recordBlock(c: Context) {
    val p = prefs(c)
    val key = "blocks_${today()}"
    p.edit()
      .putInt("blocks_total", p.getInt("blocks_total", 0) + 1)
      .putInt(key, p.getInt(key, 0) + 1)
      .apply()
  }

  fun blockStats(c: Context): Map<String, Int> {
    val p = prefs(c)
    return mapOf("total" to p.getInt("blocks_total", 0), "today" to p.getInt("blocks_${today()}", 0))
  }

  private fun hash(salt: ByteArray, pin: String): String =
    MessageDigest.getInstance("SHA-256").digest(salt + pin.toByteArray()).toHex()

  private fun ByteArray.toHex() = joinToString("") { "%02x".format(it) }

  private fun String.fromHex() = chunked(2).map { it.toInt(16).toByte() }.toByteArray()
}
