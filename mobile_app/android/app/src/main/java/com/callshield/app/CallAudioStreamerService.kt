package com.callshield.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Build
import android.os.IBinder
import android.util.Base64
import androidx.core.app.NotificationCompat
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.OutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.concurrent.thread

class CallAudioStreamerService : Service() {
    private var isRecording = false
    private var audioRecord: AudioRecord? = null
    private var echoCanceler: android.media.audiofx.AcousticEchoCanceler? = null
    private var noiseSuppressor: android.media.audiofx.NoiseSuppressor? = null
    private var automaticGainControl: android.media.audiofx.AutomaticGainControl? = null
    private var recordingThread: Thread? = null
    private var phoneNumber: String = "Unknown Caller"
    private var apiBaseUrl: String = "https://callsheild.onrender.com/api/v1"
    private val analysisExecutor = Executors.newSingleThreadExecutor()
    private val analysisInFlight = AtomicBoolean(false)

    private val sampleRate = 16000
    private val channelConfig = AudioFormat.CHANNEL_IN_MONO
    private val audioFormat = AudioFormat.ENCODING_PCM_16BIT
    private val chunkSize = 96000

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        phoneNumber = CallInterceptorModule.resolveCallNumber(intent?.getStringExtra("phoneNumber"))
        val configuredBaseUrl = intent?.getStringExtra("apiBaseUrl")?.trim()?.trimEnd('/')
        if (!configuredBaseUrl.isNullOrBlank() &&
            (configuredBaseUrl.startsWith("https://") || configuredBaseUrl.startsWith("http://"))) {
            apiBaseUrl = if (configuredBaseUrl.endsWith("/api/v1", ignoreCase = true)) {
                configuredBaseUrl
            } else {
                "$configuredBaseUrl/api/v1"
            }
        }
        startForegroundNotification(phoneNumber)
        startStreaming()
        return START_STICKY
    }

    private fun startForegroundNotification(phoneNumber: String) {
        val channelId = "callshield_live_channel"
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "CallShield Live Protection",
                NotificationManager.IMPORTANCE_HIGH
            )
            notificationManager.createNotificationChannel(channel)
        }

        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("action", "ANALYZE_CALL")
            putExtra("phoneNumber", phoneNumber)
        }
        val pendingIntent = android.app.PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("CallShield live monitoring")
            .setContentText("Analyzing microphone audio for $phoneNumber")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                101,
                notification,
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
            )
        } else {
            startForeground(101, notification)
        }
    }

    private fun startStreaming() {
        if (isRecording) return
        val minBufferSize = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat)
        val bufferSize = maxOf(minBufferSize * 4, chunkSize * 2)

        // Android requires VOICE_COMMUNICATION for concurrent telephony audio routing
        val sources = intArrayOf(
            MediaRecorder.AudioSource.VOICE_COMMUNICATION,
            MediaRecorder.AudioSource.VOICE_RECOGNITION,
            MediaRecorder.AudioSource.MIC,
            MediaRecorder.AudioSource.DEFAULT
        )

        for (source in sources) {
            try {
                val recorder = AudioRecord(source, sampleRate, channelConfig, audioFormat, bufferSize)
                if (recorder.state == AudioRecord.STATE_INITIALIZED) {
                    audioRecord = recorder
                    android.util.Log.d("CallShieldStreamer", "AudioRecord successfully initialized with source: $source")

                    try {
                        if (android.media.audiofx.AutomaticGainControl.isAvailable()) {
                            automaticGainControl = android.media.audiofx.AutomaticGainControl.create(recorder.audioSessionId)
                            automaticGainControl?.enabled = true
                            android.util.Log.d("CallShieldStreamer", "Hardware AGC enabled")
                        }
                    } catch (fxEx: Exception) {
                        android.util.Log.w("CallShieldStreamer", "Could not attach AGC: ${fxEx.message}")
                    }
                    break
                }
            } catch (e: Exception) {
                android.util.Log.w("CallShieldStreamer", "Failed to init source $source: ${e.message}")
            }
        }

        if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
            android.util.Log.e("CallShieldStreamer", "Could not initialize any AudioRecord source.")
            CallInterceptorModule.emitAnalysisError(
                phoneNumber,
                0,
                "Android did not provide a usable microphone input. Check microphone permission and close other apps using the mic."
            )
            stopSelf()
            return
        }

        try {
            audioRecord?.startRecording()
            isRecording = true
            recordingThread = thread(start = true, name = "CallShield-AudioRecord") {
                val readBuffer = ByteArray(4096)
                val chunkAccumulator = ByteArrayOutputStream()
                var chunkId = 0

                val targetChunkBytes = chunkSize

                while (isRecording) {
                    val readBytes = audioRecord?.read(readBuffer, 0, readBuffer.size) ?: -1
                    if (readBytes > 0) {
                        chunkAccumulator.write(readBuffer, 0, readBytes)

                        if (chunkAccumulator.size() >= targetChunkBytes) {
                            chunkId += 1
                            val rawChunk = chunkAccumulator.toByteArray()
                            chunkAccumulator.reset()

                            // Boost speakerphone audio with 4.5x gain & limiter
                            val amplifiedChunk = applyGainBoost(rawChunk, 4.5f)
                            val rms = calculateRms(amplifiedChunk)
                            android.util.Log.i(
                                "CallShieldStreamer",
                                "Captured chunk #$chunkId: ${amplifiedChunk.size} bytes, microphone RMS=${"%.6f".format(java.util.Locale.US, rms)}"
                            )
                            sendChunkToBackend(amplifiedChunk, chunkId, rms)
                        }
                    } else if (readBytes < 0) {
                        Thread.sleep(30)
                    }
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("CallShieldStreamer", "Recording start failed: ${e.message}")
            CallInterceptorModule.emitAnalysisError(
                phoneNumber,
                0,
                "Microphone capture could not start: ${e.message ?: "audio recorder error"}"
            )
            stopSelf()
        }
    }

    private fun applyGainBoost(buffer: ByteArray, multiplier: Float): ByteArray {
        val boosted = ByteArray(buffer.size)
        var i = 0
        while (i + 1 < buffer.size) {
            val low = buffer[i].toInt() and 0xFF
            val high = buffer[i + 1].toInt() and 0xFF
            var sample = ((high shl 8) or low).toShort().toInt()

            sample = (sample * multiplier).toInt()
            if (sample > 32767) sample = 32767
            if (sample < -32768) sample = -32768

            boosted[i] = (sample and 0xFF).toByte()
            boosted[i + 1] = ((sample shr 8) and 0xFF).toByte()
            i += 2
        }
        return boosted
    }

    private fun encryptAesGcm(plainData: ByteArray): Pair<String, String>? {
        return try {
            val keyBytes = "CallShieldAESSecretKey256Bit2026!".toByteArray(Charsets.UTF_8)
            val secretKey = javax.crypto.spec.SecretKeySpec(keyBytes, 0, 32, "AES")
            val cipher = javax.crypto.Cipher.getInstance("AES/GCM/NoPadding")
            val iv = ByteArray(12)
            java.security.SecureRandom().nextBytes(iv)
            val parameterSpec = javax.crypto.spec.GCMParameterSpec(128, iv)
            cipher.init(javax.crypto.Cipher.ENCRYPT_MODE, secretKey, parameterSpec)
            val encryptedBytes = cipher.doFinal(plainData)
            val encBase64 = Base64.encodeToString(encryptedBytes, Base64.NO_WRAP)
            val ivBase64 = Base64.encodeToString(iv, Base64.NO_WRAP)
            Pair(encBase64, ivBase64)
        } catch (e: Exception) {
            android.util.Log.e("CallShieldStreamer", "AES-256 Encryption failed: ${e.message}")
            null
        }
    }

    private fun sendChunkToBackend(pcmData: ByteArray, chunkId: Int, rms: Double) {
        if (!analysisInFlight.compareAndSet(false, true)) {
            android.util.Log.w("CallShieldStreamer", "Skipping chunk #$chunkId: previous analysis is still running")
            return
        }
        analysisExecutor.execute {
            var conn: HttpURLConnection? = null
            try {
                val url = URL("$apiBaseUrl/predict-chunk")
                val connection = url.openConnection() as HttpURLConnection
                conn = connection
                val wavData = buildWav(pcmData)
                val fileName = "live_call_$chunkId.wav"

                val encPair = encryptAesGcm(wavData)
                val jsonBody = if (encPair != null) {
                    JSONObject().apply {
                        put("filename", fileName)
                        put("encrypted_audio_base64", encPair.first)
                        put("iv_base64", encPair.second)
                    }.toString()
                } else {
                    val rawBase64 = Base64.encodeToString(wavData, Base64.NO_WRAP)
                    JSONObject().apply {
                        put("filename", fileName)
                        put("audio_base64", rawBase64)
                    }.toString()
                }

                connection.requestMethod = "POST"
                connection.setRequestProperty("Content-Type", "application/json")
                connection.setRequestProperty("Accept", "application/json")
                connection.doOutput = true
                connection.connectTimeout = 8000
                connection.readTimeout = 30000

                val os: OutputStream = connection.outputStream
                os.write(jsonBody.toByteArray(Charsets.UTF_8))
                os.flush()
                os.close()

                val responseCode = connection.responseCode
                android.util.Log.d("CallShieldStreamer", "Chunk #$chunkId sent to $url: $responseCode")
                if (responseCode in 200..299) {
                    val responseText = connection.inputStream.bufferedReader().use { it.readText() }
                    val json = JSONObject(responseText)
                    CallInterceptorModule.emitChunkPrediction(
                        phoneNumber,
                        chunkId,
                        json.optDouble("ai_probability", 0.0),
                        json.optString("predicted_label", "human"),
                        json.optString("risk_level", "safe"),
                        json.optString("raw_predicted_label", "online_ai_classified"),
                        json.optDouble("audio_rms", rms)
                    )
                } else {
                    val detail = connection.errorStream?.bufferedReader()?.use { it.readText() }
                    CallInterceptorModule.emitAnalysisError(
                        phoneNumber,
                        chunkId,
                        "Audio analysis server returned HTTP $responseCode from $url${if (detail.isNullOrBlank()) "" else ": $detail"}"
                    )
                }
            } catch (e: Exception) {
                android.util.Log.e("CallShieldStreamer", "Chunk #$chunkId analysis request failed", e)
                CallInterceptorModule.emitAnalysisError(
                    phoneNumber,
                    chunkId,
                    "Could not reach audio analysis server: ${e.message ?: "network error"}"
                )
            } finally {
                conn?.disconnect()
                analysisInFlight.set(false)
            }
        }
    }

    private fun buildWav(pcmData: ByteArray): ByteArray {
        val output = ByteArrayOutputStream()
        val totalDataLen = pcmData.size + 36
        val byteRate = sampleRate * 2

        fun writeString(value: String) = output.write(value.toByteArray(Charsets.US_ASCII))
        fun writeIntLE(value: Int) {
            output.write(value and 0xff)
            output.write((value shr 8) and 0xff)
            output.write((value shr 16) and 0xff)
            output.write((value shr 24) and 0xff)
        }
        fun writeShortLE(value: Int) {
            output.write(value and 0xff)
            output.write((value shr 8) and 0xff)
        }

        writeString("RIFF")
        writeIntLE(totalDataLen)
        writeString("WAVE")
        writeString("fmt ")
        writeIntLE(16)
        writeShortLE(1)
        writeShortLE(1)
        writeIntLE(sampleRate)
        writeIntLE(byteRate)
        writeShortLE(2)
        writeShortLE(16)
        writeString("data")
        writeIntLE(pcmData.size)
        output.write(pcmData)
        return output.toByteArray()
    }

    private fun calculateRms(pcmData: ByteArray): Double {
        if (pcmData.size < 2) return 0.0
        var sumSquares = 0.0
        var samples = 0
        var i = 0
        while (i + 1 < pcmData.size) {
            val low = pcmData[i].toInt() and 0xFF
            val high = pcmData[i + 1].toInt() and 0xFF
            val sample = ((high shl 8) or low).toShort().toDouble() / 32768.0
            sumSquares += sample * sample
            samples += 1
            i += 2
        }
        return if (samples == 0) 0.0 else kotlin.math.sqrt(sumSquares / samples)
    }

    override fun onDestroy() {
        isRecording = false
        try {
            audioRecord?.stop()
            audioRecord?.release()
        } catch (e: Exception) {
            android.util.Log.w("CallShieldStreamer", "AudioRecord cleanup failed: ${e.message}")
        }
        audioRecord = null
        try { echoCanceler?.release() } catch (_: Exception) {}
        try { noiseSuppressor?.release() } catch (_: Exception) {}
        try { automaticGainControl?.release() } catch (_: Exception) {}
        echoCanceler = null
        noiseSuppressor = null
        automaticGainControl = null
        recordingThread = null
        analysisExecutor.shutdownNow()
        super.onDestroy()
    }
}
