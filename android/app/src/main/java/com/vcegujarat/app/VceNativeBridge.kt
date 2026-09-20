package com.vcegujarat.app

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.webkit.JavascriptInterface
import android.widget.Toast
import java.net.URLEncoder

class VceNativeBridge(private val activity: Activity) {

    @JavascriptInterface
    fun isNativeApp(): Boolean {
        return true
    }

    @JavascriptInterface
    fun showToast(message: String) {
        activity.runOnUiThread {
            Toast.makeText(activity, message, Toast.LENGTH_SHORT).show()
        }
    }

    @JavascriptInterface
    fun openServerSettings() {
        activity.runOnUiThread {
            val intent = Intent(activity, ServerConfigActivity::class.java)
            activity.startActivity(intent)
        }
    }

    /**
     * Natively opens WhatsApp with pre-filled Gujarati text for citizen Udhar payment reminders.
     */
    @JavascriptInterface
    fun openWhatsApp(rawPhone: String, rawMessage: String) {
        activity.runOnUiThread {
            try {
                var phone = rawPhone.replace(Regex("[^0-9]"), "")
                if (phone.length == 10) {
                    phone = "91$phone" // Prefix India country code
                }
                val encodedMessage = URLEncoder.encode(rawMessage, "UTF-8")
                val uri = Uri.parse("https://api.whatsapp.com/send?phone=$phone&text=$encodedMessage")

                val intent = Intent(Intent.ACTION_VIEW, uri)
                intent.setPackage("com.whatsapp")
                if (intent.resolveActivity(activity.packageManager) != null) {
                    activity.startActivity(intent)
                } else {
                    // Fallback to browser or generic intent if official WhatsApp is not installed
                    val genericIntent = Intent(Intent.ACTION_VIEW, uri)
                    activity.startActivity(genericIntent)
                }
            } catch (e: Exception) {
                Toast.makeText(activity, "Could not open WhatsApp: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    @JavascriptInterface
    fun vibrate(durationMs: Long) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = activity.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vibratorManager?.defaultVibrator?.vibrate(
                    VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE)
                )
            } else {
                @Suppress("DEPRECATION")
                val vibrator = activity.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                @Suppress("DEPRECATION")
                vibrator?.vibrate(durationMs)
            }
        } catch (_: Exception) {}
    }
}
