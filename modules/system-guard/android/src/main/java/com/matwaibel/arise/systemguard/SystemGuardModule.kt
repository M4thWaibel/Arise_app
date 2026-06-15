package com.matwaibel.arise.systemguard

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

const val EVENT_SEALED_OPENED = "sealedAppOpened"

class SystemGuardModule : Module() {
  companion object {
    // Set in OnCreate so the foreground service can emit JS events.
    var instance: SystemGuardModule? = null
  }

  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context unavailable")

  fun emitSealedAppOpened(pkg: String, ts: Long) {
    sendEvent(
      EVENT_SEALED_OPENED,
      Bundle().apply {
        putString("package", pkg)
        putLong("ts", ts)
      },
    )
  }

  override fun definition() = ModuleDefinition {
    Name("SystemGuard")
    Events(EVENT_SEALED_OPENED)

    OnCreate { instance = this@SystemGuardModule }
    OnDestroy { if (instance === this@SystemGuardModule) instance = null }

    AsyncFunction("hasUsageAccess") {
      val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        appOps.unsafeCheckOpNoThrow(
          AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), context.packageName,
        )
      } else {
        @Suppress("DEPRECATION")
        appOps.checkOpNoThrow(
          AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), context.packageName,
        )
      }
      mode == AppOpsManager.MODE_ALLOWED
    }

    Function("openUsageAccessSettings") {
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      (appContext.activityProvider?.currentActivity ?: context).startActivity(intent)
    }

    AsyncFunction("hasOverlayPermission") { Settings.canDrawOverlays(context) }

    Function("requestOverlayPermission") {
      val intent = Intent(
        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
        Uri.parse("package:" + context.packageName),
      ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      (appContext.activityProvider?.currentActivity ?: context).startActivity(intent)
    }

    AsyncFunction("startGuard") { sealedPackages: List<String> ->
      val intent = Intent(context, SystemGuardService::class.java).apply {
        action = SystemGuardService.ACTION_START
        putStringArrayListExtra(SystemGuardService.EXTRA_PACKAGES, ArrayList(sealedPackages))
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(intent)
      else context.startService(intent)
    }

    AsyncFunction("stopGuard") {
      context.startService(
        Intent(context, SystemGuardService::class.java).apply { action = SystemGuardService.ACTION_STOP },
      )
    }

    AsyncFunction("listInstalledApps") {
      val pm = context.packageManager
      val launcher = Intent(Intent.ACTION_MAIN, null).addCategory(Intent.CATEGORY_LAUNCHER)
      val resolved = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        pm.queryIntentActivities(
          launcher, android.content.pm.PackageManager.ResolveInfoFlags.of(0L),
        )
      } else {
        @Suppress("DEPRECATION") pm.queryIntentActivities(launcher, 0)
      }
      resolved
        .map { mapOf("package" to it.activityInfo.packageName, "label" to it.loadLabel(pm).toString()) }
        .distinctBy { it["package"] }
        .sortedBy { (it["label"] as String).lowercase() }
    }
  }
}
