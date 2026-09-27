package com.callshield.app

import android.content.Intent
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class CallInterceptorModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private var instance: CallInterceptorModule? = null
        private val blockedNumbers = mutableSetOf<String>()
        private var pendingAnalyzeNumber: String? = null
        private var lastKnownCallNumber: String? = null

        fun rememberCallNumber(phoneNumber: String?) {
            val normalized = phoneNumber?.trim().orEmpty()
            if (normalized.isNotBlank() && normalized != "Unknown Caller") {
                lastKnownCallNumber = normalized
            }
        }

        fun resolveCallNumber(phoneNumber: String?): String {
            val normalized = phoneNumber?.trim().orEmpty()
            return when {
                normalized.isNotBlank() && normalized != "Unknown Caller" -> normalized
                !lastKnownCallNumber.isNullOrBlank() -> lastKnownCallNumber!!
                else -> "Unknown Caller"
            }
        }

        fun emitCallRinging(phoneNumber: String) {
            rememberCallNumber(phoneNumber)
            val params = Arguments.createMap().apply {
                putString("phoneNumber", resolveCallNumber(phoneNumber))
                putString("event", "ON_CALL_RINGING")
            }
            instance?.sendEvent("CallShieldNativeEvent", params)
        }

        fun emitCallEnded(phoneNumber: String) {
            val resolvedNumber = resolveCallNumber(phoneNumber)
            val params = Arguments.createMap().apply {
                putString("phoneNumber", resolvedNumber)
                putString("event", "ON_CALL_ENDED")
            }
            instance?.sendEvent("CallShieldNativeEvent", params)
            lastKnownCallNumber = null
        }

        fun emitCallConnected(phoneNumber: String) {
            rememberCallNumber(phoneNumber)
            val params = Arguments.createMap().apply {
                putString("phoneNumber", resolveCallNumber(phoneNumber))
                putString("event", "ON_CALL_CONNECTED")
            }
            instance?.sendEvent("CallShieldNativeEvent", params)
        }

        fun handleAnalyzeCallClicked(phoneNumber: String) {
            val resolvedNumber = resolveCallNumber(phoneNumber)
            rememberCallNumber(resolvedNumber)
            pendingAnalyzeNumber = resolvedNumber
            emitAnalyzeCallClicked(resolvedNumber)
        }

        private fun emitAnalyzeCallClicked(phoneNumber: String) {
            val params = Arguments.createMap().apply {
                putString("phoneNumber", phoneNumber)
                putString("event", "ON_ANALYZE_CALL_CLICKED")
            }
            instance?.sendEvent("CallShieldNativeEvent", params)
        }

        fun emitChunkPrediction(
            phoneNumber: String,
            chunkId: Int,
            aiProbability: Double,
            predictedLabel: String,
            riskLevel: String,
            rawPredictedLabel: String,
            audioRms: Double
        ) {
            val resolvedNumber = resolveCallNumber(phoneNumber)
            val params = Arguments.createMap().apply {
                putString("phoneNumber", resolvedNumber)
                putString("event", "ON_CHUNK_CAPTURED")
                putInt("chunkId", chunkId)
                putDouble("aiProbability", aiProbability)
                putString("predictedLabel", predictedLabel)
                putString("riskLevel", riskLevel)
                putString("rawPredictedLabel", rawPredictedLabel)
                putDouble("audioRms", audioRms)
            }
            instance?.sendEvent("CallShieldNativeEvent", params)
        }

        fun emitAnalysisError(phoneNumber: String, chunkId: Int, message: String) {
            val params = Arguments.createMap().apply {
                putString("phoneNumber", resolveCallNumber(phoneNumber))
                putString("event", "ON_ANALYSIS_ERROR")
                putInt("chunkId", chunkId)
                putString("message", message)
            }
            instance?.sendEvent("CallShieldNativeEvent", params)
        }

        fun isNumberBlocked(phoneNumber: String): Boolean {
            return blockedNumbers.contains(phoneNumber)
        }
    }

    init {
        instance = this
    }

    override fun getName(): String {
        return "CallInterceptorModule"
    }

    private fun sendEvent(eventName: String, params: Any?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    @ReactMethod
    fun startCallProtection(apiBaseUrl: String, phoneNumber: String, promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, CallAudioStreamerService::class.java).apply {
                putExtra("apiBaseUrl", apiBaseUrl)
                putExtra("phoneNumber", phoneNumber)
            }
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(intent)
            } else {
                reactApplicationContext.startService(intent)
            }

            val connectParams = Arguments.createMap().apply {
                putString("event", "ON_CALL_CONNECTED")
            }
            sendEvent("CallShieldNativeEvent", connectParams)

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getPendingAnalyzeCall(promise: Promise) {
        val number = pendingAnalyzeNumber
        if (number == null) {
            promise.resolve(null)
            return
        }

        pendingAnalyzeNumber = null
        val params = Arguments.createMap().apply {
            putString("phoneNumber", number)
            putString("event", "ON_ANALYZE_CALL_CLICKED")
        }
        promise.resolve(params)
    }

    @ReactMethod
    fun stopCallProtection(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, CallAudioStreamerService::class.java)
            reactApplicationContext.stopService(intent)

            val endParams = Arguments.createMap().apply {
                putString("event", "ON_CALL_ENDED")
            }
            sendEvent("CallShieldNativeEvent", endParams)

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", e.message)
        }
    }

    @ReactMethod
    fun blockNumber(number: String, promise: Promise) {
        blockedNumbers.add(number)
        promise.resolve(true)
    }

    @ReactMethod
    fun unblockNumber(number: String, promise: Promise) {
        blockedNumbers.remove(number)
        promise.resolve(true)
    }
}
