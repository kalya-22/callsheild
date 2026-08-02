package com.callshield.app

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private val RECORD_AUDIO_REQUEST_CODE = 101

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)

        // Request Audio recording permission for microphone features
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.RECORD_AUDIO),
                RECORD_AUDIO_REQUEST_CODE
            )
        }

        configureWebView()

        // Loads local bundled offline web application inside the APK (file:///android_asset/www/index.html)
        // If local assets are not packaged yet, falls back to http://10.0.2.2:5173
        val localAssetPath = "file:///android_asset/www/index.html"
        val devServerUrl = "http://10.0.2.2:5173"

        try {
            assets.open("www/index.html").close()
            webView.loadUrl(localAssetPath)
        } catch (e: Exception) {
            // Asset not found yet, load local dev server
            webView.loadUrl(devServerUrl)
        }
    }

    private fun configureWebView() {
        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.allowFileAccessFromFileURLs = true
        settings.allowUniversalAccessFromFileURLs = true
        settings.mediaPlaybackRequiresUserGesture = false

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                if (url != null) {
                    view?.loadUrl(url)
                }
                return true
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest?) {
                // Grant microphone/audio permission to web app
                request?.grant(request.resources)
            }
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
