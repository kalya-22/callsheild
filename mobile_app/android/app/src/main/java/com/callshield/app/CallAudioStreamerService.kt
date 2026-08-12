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
import java.io.OutputStream
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

class CallAudioStreamerService : Service() {

    private var isRecording = false
    private var audioRecord: AudioRecord? = null
    private var recordingThread: Thread? = null

    private val sampleRate = 16000
    private val channelConfig = AudioFormat.CHANNEL_IN_MONO
    private val audioFormat = AudioFormat.ENCODING_PCM_16BIT
    private val chunkSize = 96000 // 3 seconds of 16kHz PCM audio

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val number = intent?.getStringExtra("phoneNumber") ?: "Unknown Caller"
        startForegroundNotification(number)
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

        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("🛡️ CallShield Protection Active")
            .setContentText("Analyzing live audio from $phoneNumber...")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        startForeground(101, notification)
    }

    private fun startStreaming() {
        if (isRecording) return
        val minBufferSize = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat)
        val bufferSize = Math.max(minBufferSize, chunkSize)

        val sources = intArrayOf(
            MediaRecorder.AudioSource.VOICE_COMMUNICATION,
            MediaRecorder.AudioSource.VOICE_RECOGNITION,
            MediaRecorder.AudioSource.CAMCORDER,
            MediaRecorder.AudioSource.MIC,
            MediaRecorder.AudioSource.DEFAULT
        )

        for (source in sources) {
            try {
                val recorder = AudioRecord(source, sampleRate, channelConfig, audioFormat, bufferSize)
                if (recorder.state == AudioRecord.STATE_INITIALIZED) {
                    audioRecord = recorder
                    android.util.Log.d("CallShieldStreamer", "Successfully initialized AudioRecord with source: $source")
                    break
                }
            } catch (e: Exception) {
                android.util.Log.w("CallShieldStreamer", "Failed to init source $source: ${e.message}")
            }
        }

        if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
            android.util.Log.e("CallShieldStreamer", "Could not initialize any AudioRecord source.")
            stopSelf()
            return
        }

        try {
            audioRecord?.startRecording()
            isRecording = true

            recordingThread = thread(start = true) {
                val buffer = ByteArray(chunkSize)
                var chunkId = 0
                while (isRecording) {
                    val readBytes = audioRecord?.read(buffer, 0, chunkSize) ?: 0
                    if (readBytes > 0) {
                        chunkId++
                        val base64Data = Base64.encodeToString(buffer, 0, readBytes, Base64.NO_WRAP)
                        sendChunkToBackend(base64Data, chunkId)
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
            stopSelf()
        }
    }

    private fun sendChunkToBackend(base64Data: String, chunkId: Int) {
        thread {
            try {
                val url = URL("http://10.194.245.231:8000/api/v1/predict-chunk")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.doOutput = true
                conn.connectTimeout = 3000
                conn.readTimeout = 3000

                val jsonPayload = "{\"filename\":\"live_call_chunk_$chunkId.wav\",\"audio_base64\":\"$base64Data\"}"
                val os: OutputStream = conn.outputStream
                os.write(jsonPayload.toByteArray(Charsets.UTF_8))
                os.flush()
                os.close()

                val responseCode = conn.responseCode
                android.util.Log.d("CallShieldStreamer", "Chunk #$chunkId posted to backend. Response: $responseCode")
                conn.disconnect()
            } catch (e: Exception) {
                android.util.Log.w("CallShieldStreamer", "Failed to post chunk #$chunkId to backend: ${e.message}")
            }
        }
    }

    override fun onDestroy() {
        isRecording = false
        try {
            audioRecord?.stop()
            audioRecord?.release()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        audioRecord = null
        recordingThread = null
        super.onDestroy()
    }
}
