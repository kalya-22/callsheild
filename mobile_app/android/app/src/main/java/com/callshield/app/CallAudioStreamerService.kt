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
import androidx.core.app.NotificationCompat
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.OutputStream
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

class CallAudioStreamerService : Service() {
    private var isRecording = false
    private var audioRecord: AudioRecord? = null
    private var recordingThread: Thread? = null
    private var phoneNumber: String = "Unknown Caller"

    private val sampleRate = 16000
    private val channelConfig = AudioFormat.CHANNEL_IN_MONO
    private val audioFormat = AudioFormat.ENCODING_PCM_16BIT
    private val chunkSize = 96000

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        phoneNumber = intent?.getStringExtra("phoneNumber") ?: "Unknown Caller"
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

        startForeground(101, notification)
    }

    private fun startStreaming() {
        if (isRecording) return
        val minBufferSize = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat)
        val bufferSize = maxOf(minBufferSize, chunkSize)

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
                    android.util.Log.d("CallShieldStreamer", "AudioRecord initialized with source: $source")
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
                        chunkId += 1
                        sendChunkToBackend(buffer.copyOf(readBytes), chunkId)
                    }
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("CallShieldStreamer", "Recording failed: ${e.message}")
            stopSelf()
        }
    }

    private fun sendChunkToBackend(pcmData: ByteArray, chunkId: Int) {
        thread {
            try {
                val url = URL("http://10.251.165.231:8000/api/v1/predict-chunk")
                val conn = url.openConnection() as HttpURLConnection
                val boundary = "CallShieldBoundary${System.currentTimeMillis()}"
                val wavData = buildWav(pcmData)
                val fileName = "live_call_$chunkId.wav"

                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")
                conn.setRequestProperty("Accept", "application/json")
                conn.doOutput = true
                conn.connectTimeout = 10000
                conn.readTimeout = 15000

                val os: OutputStream = conn.outputStream
                os.write("--$boundary\r\n".toByteArray())
                os.write("Content-Disposition: form-data; name=\"file\"; filename=\"$fileName\"\r\n".toByteArray())
                os.write("Content-Type: audio/wav\r\n\r\n".toByteArray())
                os.write(wavData)
                os.write("\r\n--$boundary--\r\n".toByteArray())
                os.flush()
                os.close()

                val responseCode = conn.responseCode
                android.util.Log.d("CallShieldStreamer", "Chunk #$chunkId response: $responseCode")
                if (responseCode in 200..299) {
                    val responseText = conn.inputStream.bufferedReader().use { it.readText() }
                    val json = JSONObject(responseText)
                    CallInterceptorModule.emitChunkPrediction(
                        phoneNumber,
                        chunkId,
                        json.optDouble("ai_probability", 0.0),
                        json.optString("predicted_label", "human"),
                        json.optString("risk_level", "low")
                    )
                }
                conn.disconnect()
            } catch (e: Exception) {
                android.util.Log.w("CallShieldStreamer", "Failed to post chunk #$chunkId: ${e.message}")
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

    override fun onDestroy() {
        isRecording = false
        try {
            audioRecord?.stop()
            audioRecord?.release()
        } catch (e: Exception) {
            android.util.Log.w("CallShieldStreamer", "AudioRecord cleanup failed: ${e.message}")
        }
        audioRecord = null
        recordingThread = null
        super.onDestroy()
    }
}
