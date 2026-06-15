package com.matwaibel.arise.systemguard

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.net.Uri
import android.provider.Settings
import android.view.Gravity
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class GuardOverlay(private val context: Context) {
  private val wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
  private var view: LinearLayout? = null

  fun show() {
    if (view != null || !Settings.canDrawOverlays(context)) return
    val root = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setBackgroundColor(Color.parseColor("#E605070D"))
      setPadding(48, 48, 48, 48)
      addView(
        TextView(context).apply {
          text = "[ ! ] App selado pelo Sistema\nPenalidade ativa."
          setTextColor(Color.WHITE)
          textSize = 18f
        },
      )
      addView(
        Button(context).apply {
          text = "Voltar ao Sistema"
          setOnClickListener {
            context.startActivity(
              Intent(Intent.ACTION_VIEW, Uri.parse("ariseapp://penalty"))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
            )
            hide()
          }
        },
      )
    }
    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
      WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
      PixelFormat.TRANSLUCENT,
    )
    wm.addView(root, params)
    view = root
  }

  fun hide() {
    view?.let { runCatching { wm.removeView(it) } }
    view = null
  }
}
