package com.vcegujarat.app

import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.CookieManager
import android.webkit.ValueCallback
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private lateinit var progressBar: ProgressBar
    private lateinit var statusDot: View
    private lateinit var tvStatusLabel: TextView
    private lateinit var btnRefresh: ImageButton
    private lateinit var layoutErrorOverlay: View
    private lateinit var btnErrorRetry: Button

    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    // Register File Chooser Activity Result
    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (filePathCallback != null) {
            val results = if (result.resultCode == Activity.RESULT_OK && result.data != null) {
                val data = result.data
                val dataString = data?.dataString
                val clipData = data?.clipData
                if (clipData != null) {
                    val count = clipData.itemCount
                    Array(count) { i -> clipData.getItemAt(i).uri }
                } else if (dataString != null) {
                    arrayOf(Uri.parse(dataString))
                } else {
                    null
                }
            } else {
                null
            }
            filePathCallback?.onReceiveValue(results)
            filePathCallback = null
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initViews()
        setupWebView()
        setupListeners()
        setupBackNavigation()

        loadServerUrl()
    }

    private fun initViews() {
        webView = findViewById(R.id.web_view)
        swipeRefreshLayout = findViewById(R.id.swipe_refresh_layout)
        progressBar = findViewById(R.id.page_progress_bar)
        statusDot = findViewById(R.id.status_dot)
        tvStatusLabel = findViewById(R.id.tv_status_label)
        btnRefresh = findViewById(R.id.btn_native_refresh)
        layoutErrorOverlay = findViewById(R.id.layout_error_overlay)

        btnErrorRetry = layoutErrorOverlay.findViewById(R.id.btn_error_retry)

        // Configure pull to refresh colors matching Terracotta
        swipeRefreshLayout.setColorSchemeColors(
            ContextCompat.getColor(this, R.color.accent),
            ContextCompat.getColor(this, R.color.revenue)
        )
        swipeRefreshLayout.setProgressBackgroundColorSchemeColor(
            ContextCompat.getColor(this, R.color.bg_surface_elevated)
        )
    }

    private fun setupWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.setSupportZoom(true)
        settings.builtInZoomControls = false
        settings.displayZoomControls = false
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        // Append custom mobile app flag to User-Agent
        val defaultUserAgent = settings.userAgentString
        settings.userAgentString = "$defaultUserAgent VCE-Android-Native/1.0.0"

        // Enable cookies
        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)

        // Attach Native Bridges & Handlers
        val nativeBridge = VceNativeBridge(this)
        webView.addJavascriptInterface(nativeBridge, "AndroidBridge")

        val downloadHandler = VceDownloadHandler(this)
        webView.setDownloadListener(downloadHandler)

        val webChromeClient = VceWebChromeClient(this, progressBar) { callback, params ->
            filePathCallback?.onReceiveValue(null)
            filePathCallback = callback

            val intent = params?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                type = "*/*"
                addCategory(Intent.CATEGORY_OPENABLE)
            }
            try {
                fileChooserLauncher.launch(intent)
                true
            } catch (e: Exception) {
                filePathCallback = null
                Toast.makeText(this, "Cannot open file chooser: ${e.message}", Toast.LENGTH_SHORT).show()
                false
            }
        }
        webView.webChromeClient = webChromeClient

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val url = request?.url?.toString() ?: return false

                // Prevent re-downloading APK inside the native Android app
                if (url.contains("/download/apk") || url.endsWith(".apk")) {
                    Toast.makeText(this@MainActivity, "You are already using the VCE Pali Android app", Toast.LENGTH_SHORT).show()
                    return true
                }

                // Native WhatsApp Intent routing
                if (url.startsWith("https://wa.me/") ||
                    url.startsWith("whatsapp://") ||
                    url.startsWith("https://api.whatsapp.com/")
                ) {
                    try {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        intent.setPackage("com.whatsapp")
                        if (intent.resolveActivity(packageManager) != null) {
                            startActivity(intent)
                        } else {
                            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                        }
                    } catch (_: Exception) {
                        try {
                            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                        } catch (_: Exception) {}
                    }
                    return true
                }

                // Native phone and email dialing
                if (url.startsWith("tel:") || url.startsWith("mailto:")) {
                    try {
                        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                        return true
                    } catch (_: Exception) {}
                }

                return false
            }

            private fun injectHideApkScript(view: WebView?) {
                val script = """
                    (function() {
                        try {
                            document.documentElement.classList.add('is-native-app');
                            var style = document.getElementById('native-hide-apk-style');
                            if (!style) {
                                style = document.createElement('style');
                                style.id = 'native-hide-apk-style';
                                style.textContent = '.apk-download-option, #card-apk-distribution, [href*="/download/apk"], [download*=".apk"], #card-cloud-hosting, #form-backend-config, [id*="backend-url"], .server-config-option { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }';
                                (document.head || document.documentElement).appendChild(style);
                            }
                            document.querySelectorAll('.apk-download-option, #card-apk-distribution, [href*="/download/apk"], [download*=".apk"], #card-cloud-hosting, #form-backend-config, .server-config-option').forEach(function(el) {
                                el.remove();
                            });
                        } catch(e) {}
                    })();
                """.trimIndent()
                view?.evaluateJavascript(script, null)
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                setConnectionStatus(Status.CHECKING)
                injectHideApkScript(view)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                swipeRefreshLayout.isRefreshing = false
                layoutErrorOverlay.visibility = View.GONE
                setConnectionStatus(Status.CONNECTED)
                injectHideApkScript(view)
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    swipeRefreshLayout.isRefreshing = false
                    setConnectionStatus(Status.DISCONNECTED)
                    showErrorOverlay()
                }
            }
        }
    }

    private fun setupListeners() {
        swipeRefreshLayout.setOnRefreshListener {
            webView.reload()
        }

        btnRefresh.setOnClickListener {
            loadServerUrl()
        }

        btnErrorRetry.setOnClickListener {
            layoutErrorOverlay.visibility = View.GONE
            loadServerUrl()
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    showExitDialog()
                }
            }
        })
    }

    private fun showExitDialog() {
        AlertDialog.Builder(this)
            .setTitle("VCE Pali")
            .setMessage("Are you sure you want to close the e-Gram Workstation app?")
            .setPositiveButton("Close App") { _, _ -> finish() }
            .setNegativeButton("Stay", null)
            .show()
    }

    private fun loadServerUrl() {
        val serverUrl = NetworkUtils.getServerUrl(this)
        setConnectionStatus(Status.CHECKING)

        layoutErrorOverlay.visibility = View.GONE
        webView.loadUrl(serverUrl)

        // Perform health check ping in the background for live status feedback
        NetworkUtils.checkServerHealth(serverUrl) { isSuccess, latencyMs, message ->
            if (isSuccess) {
                setConnectionStatus(Status.CONNECTED)
            } else {
                setConnectionStatus(Status.DISCONNECTED)
            }
        }
    }

    private fun showErrorOverlay() {
        layoutErrorOverlay.visibility = View.VISIBLE
    }

    private enum class Status {
        CONNECTED, DISCONNECTED, CHECKING
    }

    private fun setConnectionStatus(status: Status) {
        when (status) {
            Status.CONNECTED -> {
                statusDot.setBackgroundResource(R.drawable.shape_dot_connected)
                tvStatusLabel.text = "Online"
                tvStatusLabel.setTextColor(ContextCompat.getColor(this, R.color.revenue))
            }
            Status.DISCONNECTED -> {
                statusDot.setBackgroundResource(R.drawable.shape_dot_disconnected)
                tvStatusLabel.text = "Offline"
                tvStatusLabel.setTextColor(ContextCompat.getColor(this, R.color.expense))
            }
            Status.CHECKING -> {
                statusDot.setBackgroundResource(R.drawable.shape_dot_checking)
                tvStatusLabel.text = "Connecting…"
                tvStatusLabel.setTextColor(ContextCompat.getColor(this, R.color.pending))
            }
        }
    }
}
