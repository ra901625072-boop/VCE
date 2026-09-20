package com.vcegujarat.app

import android.app.Activity
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.android.material.textfield.TextInputEditText

class ServerConfigActivity : AppCompatActivity() {

    private lateinit var etServerUrl: TextInputEditText
    private lateinit var btnTestConnection: Button
    private lateinit var btnSaveConnect: Button
    private lateinit var btnBack: ImageButton
    private lateinit var btnPresetWifi: Button
    private lateinit var btnPresetEmulator: Button
    private lateinit var btnPresetUsb: Button
    private lateinit var layoutTestResult: LinearLayout
    private lateinit var progressTest: ProgressBar
    private lateinit var tvTestResult: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_server_config)

        etServerUrl = findViewById(R.id.et_server_url)
        btnTestConnection = findViewById(R.id.btn_test_connection)
        btnSaveConnect = findViewById(R.id.btn_save_connect)
        btnBack = findViewById(R.id.btn_config_back)
        btnPresetWifi = findViewById(R.id.btn_preset_wifi)
        btnPresetEmulator = findViewById(R.id.btn_preset_emulator)
        btnPresetUsb = findViewById(R.id.btn_preset_usb)
        layoutTestResult = findViewById(R.id.layout_test_result)
        progressTest = findViewById(R.id.progress_test)
        tvTestResult = findViewById(R.id.tv_test_result)

        // Pre-fill current saved server URL
        val currentUrl = NetworkUtils.getServerUrl(this)
        etServerUrl.setText(currentUrl)

        // Presets
        btnPresetWifi.setOnClickListener {
            etServerUrl.setText(NetworkUtils.DEFAULT_SERVER_URL)
        }

        btnPresetEmulator.setOnClickListener {
            etServerUrl.setText(NetworkUtils.EMULATOR_SERVER_URL)
        }

        btnPresetUsb.setOnClickListener {
            etServerUrl.setText(NetworkUtils.USB_SERVER_URL)
        }

        // Back button
        btnBack.setOnClickListener {
            finish()
        }

        // Test Connection
        btnTestConnection.setOnClickListener {
            val urlToTest = etServerUrl.text?.toString()?.trim() ?: ""
            if (urlToTest.isEmpty()) {
                Toast.makeText(this, "Please enter a server URL", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            layoutTestResult.visibility = View.VISIBLE
            progressTest.visibility = View.VISIBLE
            tvTestResult.text = "Testing connection to $urlToTest/api/health…"
            tvTestResult.setTextColor(ContextCompat.getColor(this, R.color.text_secondary))

            NetworkUtils.checkServerHealth(urlToTest) { isSuccess, latencyMs, message ->
                progressTest.visibility = View.GONE
                if (isSuccess) {
                    tvTestResult.text = "SUCCESS: Backend Online! Response time: ${latencyMs}ms"
                    tvTestResult.setTextColor(ContextCompat.getColor(this, R.color.revenue))
                } else {
                    tvTestResult.text = "FAILED: $message\nEnsure server is running and device is on Wi-Fi."
                    tvTestResult.setTextColor(ContextCompat.getColor(this, R.color.expense))
                }
            }
        }

        // Save and Connect
        btnSaveConnect.setOnClickListener {
            val newUrl = etServerUrl.text?.toString()?.trim() ?: ""
            if (newUrl.isEmpty()) {
                Toast.makeText(this, "Please enter a server URL", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            NetworkUtils.saveServerUrl(this, newUrl)
            Toast.makeText(this, "Server URL updated!", Toast.LENGTH_SHORT).show()
            setResult(Activity.RESULT_OK)
            finish()
        }
    }
}
