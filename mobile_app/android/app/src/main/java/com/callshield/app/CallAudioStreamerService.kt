package com.callshield.app

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.util.Base64
import kotlin.concurrent.thread

class CallAudioStreamerService {

    private var isRecording = false
    private var audioRecord: AudioRecord? = null
    private var recordingThread: Thread? = null

    private val sampleRate = 16000
    private val channelConfig = AudioFormat.CHANNEL_IN_MONO
    private val audioFormat = AudioFormat.ENCODING_PCM_16BIT
    
    // 3 seconds of 16kHz 16-bit PCM audio = 16000 * 2 bytes * 3 = 96000 bytes
    private val chunkSize = 96000

    fun startStreaming(onChunkReady: (String) -> Unit) {
        if (isRecording) return

        val minBufferSize = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat)
        val bufferSize = Math.max(minBufferSize, chunkSize)

        try {
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.VOICE_COMMUNICATION,
                sampleRate,
                channelConfig,
                audioFormat,
                bufferSize
            )

            if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
                // Fallback to MIC if VOICE_COMMUNICATION is restricted by OS
                audioRecord = AudioRecord(
                    MediaRecorder.AudioSource.MIC,
                    sampleRate,
                    channelConfig,
                    audioFormat,
                    bufferSize
                )
            }

            audioRecord?.startRecording()
            isRecording = true

            recordingThread = thread(start = true) {
                val buffer = ByteArray(chunkSize)
                while (isRecording) {
                    val readBytes = audioRecord?.read(buffer, 0, chunkSize) ?: 0
                    if (readBytes > 0) {
                        val base64Data = Base64.encodeToString(buffer, 0, readBytes, Base64.NO_WRAP)
                        onChunkReady(base64Data)
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
            stopStreaming()
        }
    }

    fun stopStreaming() {
        isRecording = false
        try {
            audioRecord?.stop()
            audioRecord?.release()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        audioRecord = null
        recordingThread = null
    }
}
