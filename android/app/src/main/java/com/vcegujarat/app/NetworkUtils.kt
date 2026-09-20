package com.vcegujarat.app

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Handler
import android.os.Looper
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

object NetworkUtils {
    private const val PREFS_NAME = "vce_settings"
    private const val KEY_SERVER_URL = "server_url"

    // Default to the host Wi-Fi IP address detected on this machine
    const val DEFAULT_SERVER_URL = "http://10.212.82.62:8000"
    const val EMULATOR_SERVER_URL = "http://10.0.2.2:8000"
    const val USB_SERVER_URL = "http://localhost:8000"

    private val executor = Executors.newSingleThreadExecutor()
    private val mainHandler = Handler(Looper.getMainLooper())

    fun getServerUrl(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_SERVER_URL, DEFAULT_SERVER_URL) ?: DEFAULT_SERVER_URL
    }

    fun saveServerUrl(context: Context, rawUrl: String) {
        var cleanUrl = rawUrl.trim()
        if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
            cleanUrl = "http://$cleanUrl"
        }
        if (cleanUrl.endsWith("/")) {
            cleanUrl = cleanUrl.substring(0, cleanUrl.length - 1)
        }
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_SERVER_URL, cleanUrl).apply()
    }

    fun isNetworkAvailable(context: Context): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return false
        val activeNetwork = cm.activeNetwork ?: return false
        val capabilities = cm.getNetworkCapabilities(activeNetwork) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    /**
     * Pings the FastAPI /api/health endpoint asynchronously.
     * callback receives: (isSuccess: Boolean, latencyMs: Long, message: String?)
     */
    fun checkServerHealth(serverBaseUrl: String, callback: (Boolean, Long, String?) -> Unit) {
        executor.execute {
            val startTime = System.currentTimeMillis()
            var connection: HttpURLConnection? = null
            var success = false
            var message: String? = null
            var latency = 0L

            try {
                var target = serverBaseUrl.trim()
                if (!target.startsWith("http://") && !target.startsWith("https://")) {
                    target = "http://$target"
                }
                if (target.endsWith("/")) {
                    target = target.substring(0, target.length - 1)
                }
                val healthUrl = URL("$target/api/health")

                connection = healthUrl.openConnection() as HttpURLConnection
                connection.connectTimeout = 4000
                connection.readTimeout = 4000
                connection.requestMethod = "GET"
                connection.setRequestProperty("Accept", "application/json")

                val responseCode = connection.responseCode
                latency = System.currentTimeMillis() - startTime

                if (responseCode in 200..299) {
                    success = true
                    message = "200 OK (${latency}ms)"
                } else {
                    message = "HTTP $responseCode (${latency}ms)"
                }
            } catch (e: Exception) {
                latency = System.currentTimeMillis() - startTime
                message = e.localizedMessage ?: "Connection timed out"
            } finally {
                connection?.disconnect()
            }

            mainHandler.post {
                callback(success, latency, message)
            }
        }
    }
}
