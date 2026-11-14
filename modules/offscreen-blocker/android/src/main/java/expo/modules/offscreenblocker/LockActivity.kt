package expo.modules.offscreenblocker

import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.os.CountDownTimer
import android.text.InputType
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.window.OnBackInvokedDispatcher
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView

/** Full-screen block shown over a locked app. Back and Leave both lead to the home screen. */
class LockActivity : Activity() {
  private lateinit var title: TextView
  private lateinit var message: TextView
  private lateinit var pinInput: EditText
  private lateinit var error: TextView
  private var countdown: CountDownTimer? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(buildUi())
    bind(intent)
    if (Build.VERSION.SDK_INT >= 33) {
      onBackInvokedDispatcher.registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT) {
        goHome()
      }
    }
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    bind(intent)
  }

  override fun onResume() {
    super.onResume()
    // Unlocked while we were in the background (e.g. tasks finished): get out of the way.
    if (BlockerStore.isUnlockedToday(this)) finish()
  }

  @Deprecated("Handled for API < 33")
  override fun onBackPressed() = goHome()

  override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
    if (keyCode == KeyEvent.KEYCODE_BACK) {
      goHome()
      return true
    }
    return super.onKeyDown(keyCode, event)
  }

  override fun onDestroy() {
    countdown?.cancel()
    super.onDestroy()
  }

  private fun bind(intent: Intent) {
    val pkg = intent.getStringExtra(EXTRA_PACKAGE)
    val label =
      try {
        pkg?.let { packageManager.getApplicationLabel(packageManager.getApplicationInfo(it, 0)).toString() }
      } catch (_: PackageManager.NameNotFoundException) {
        null
      } ?: "This app"
    title.text = "$label is locked"
    message.text =
      if (BlockerStore.pinIsStale(this)) "Open OffScreen, finish your tasks and get today's PIN."
      else "Finish today's tasks in OffScreen to get the PIN, or leave."
    pinInput.setText("")
    error.text = ""
    applyLockout()
  }

  private fun goHome() {
    startActivity(
      Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    )
    finish()
  }

  private fun openOffScreen() {
    packageManager.getLaunchIntentForPackage(packageName)?.let {
      it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      startActivity(it)
    }
    finish()
  }

  private fun submit() {
    if (BlockerStore.lockoutRemaining(this) > 0) return
    val entered = pinInput.text.toString()
    if (BlockerStore.verifyPin(this, entered)) {
      BlockerStore.clearFailedAttempts(this)
      BlockerStore.setUnlockedToday(this, true)
      finish()
      return
    }
    pinInput.setText("")
    if (BlockerStore.recordFailedAttempt(this)) applyLockout() else error.text = "Wrong PIN"
  }

  private fun applyLockout() {
    countdown?.cancel()
    val remaining = BlockerStore.lockoutRemaining(this)
    if (remaining <= 0) {
      pinInput.isEnabled = true
      return
    }
    pinInput.isEnabled = false
    countdown =
      object : CountDownTimer(remaining, 1_000) {
          override fun onTick(ms: Long) {
            error.text = "Too many attempts. Try again in ${ms / 1000 + 1}s"
          }

          override fun onFinish() {
            error.text = ""
            pinInput.isEnabled = true
          }
        }
        .start()
  }

  private fun buildUi(): View {
    val density = resources.displayMetrics.density
    val pad = (24 * density).toInt()

    fun label(size: Float, bold: Boolean = false, color: Int = Color.WHITE) =
      TextView(this).apply {
        textSize = size
        setTextColor(color)
        gravity = Gravity.CENTER
        if (bold) setTypeface(typeface, Typeface.BOLD)
      }

    fun button(text: String, filled: Boolean, onClick: () -> Unit) =
      Button(this).apply {
        this.text = text
        isAllCaps = false
        setTextColor(if (filled) Color.parseColor("#6C5CE7") else Color.WHITE)
        setTypeface(typeface, Typeface.BOLD)
        background =
          GradientDrawable().apply {
            cornerRadius = 24f * density
            if (filled) setColor(Color.WHITE)
            else setStroke((1.5f * density).toInt(), Color.parseColor("#B3FFFFFF"))
          }
        setOnClickListener { onClick() }
      }

    // Space (not a plain View): a bare View with wrap_content expands to fill the screen.
    fun space(dp: Int) = android.widget.Space(this).apply { minimumHeight = (dp * density).toInt() }

    title = label(26f, bold = true)
    message = label(16f, color = Color.parseColor("#E6FFFFFF"))
    error = label(14f, bold = true, color = Color.parseColor("#FFE066"))
    pinInput =
      EditText(this).apply {
        hint = "Enter PIN"
        setHintTextColor(Color.parseColor("#9A96B8"))
        setTextColor(Color.parseColor("#1E1B3A"))
        gravity = Gravity.CENTER
        textSize = 24f
        // Plain number input (digits visible) so the PIN can also be pasted.
        inputType = InputType.TYPE_CLASS_NUMBER
        setPadding(pad / 2, pad / 2, pad / 2, pad / 2)
        background =
          GradientDrawable().apply {
            cornerRadius = 16f * density
            setColor(Color.WHITE)
          }
        setOnEditorActionListener { _, _, _ ->
          submit()
          true
        }
      }

    val content =
      LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        gravity = Gravity.CENTER
        setPadding(pad, pad, pad, pad)
        addView(title)
        addView(space(12))
        addView(message)
        addView(space(32))
        addView(pinInput)
        addView(error)
        addView(space(8))
        addView(button("Unlock", true) { submit() })
        addView(space(8))
        addView(button("Open OffScreen", false) { openOffScreen() })
        addView(space(8))
        addView(button("Leave", false) { goHome() })
        // Children fill the width so the PIN box is obvious.
        for (i in 0 until childCount) {
          getChildAt(i).layoutParams =
            LinearLayout.LayoutParams(
              LinearLayout.LayoutParams.MATCH_PARENT,
              LinearLayout.LayoutParams.WRAP_CONTENT,
            )
        }
      }

    // Scrolls when the keyboard is up so the field and buttons stay reachable.
    window.setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)
    return android.widget.ScrollView(this).apply {
      isFillViewport = true
      background =
        GradientDrawable(
          GradientDrawable.Orientation.TL_BR,
          intArrayOf(Color.parseColor("#6C5CE7"), Color.parseColor("#A855F7"), Color.parseColor("#FF6FB1")),
        )
      addView(
        content,
        android.view.ViewGroup.LayoutParams(
          android.view.ViewGroup.LayoutParams.MATCH_PARENT,
          android.view.ViewGroup.LayoutParams.MATCH_PARENT,
        ),
      )
    }
  }

  companion object {
    const val EXTRA_PACKAGE = "package"
  }
}
