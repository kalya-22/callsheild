package com.callshield.app

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

        fun emitCallRinging(phoneNumber: String) {
            val params = Arguments.createMap().apply {
                putString("phoneNumber", phoneNumber)
                putString("event", "ON_CALL_RINGING")
            }
            instance?.sendEvent("CallShieldNativeEvent", params)
        }

        fun isNumberBlocked(phoneNumber: String): Boolean {
            return blockedNumbers.contains(phoneNumber)
        }
    }

    private var audioStreamer: CallAudioStreamerService? = null

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
    fun startCallProtection(promise: Promise) {
        try {
            if (audioStreamer == null) {
                audioStreamer = CallAudioStreamerService()
            }

            audioStreamer?.startStreaming { base64PcmChunk ->
                val params = Arguments.createMap().apply {
                    putString("event", "ON_CHUNK_CAPTURED")
                    putString("audioBase64", base64PcmChunk)
                    putDouble("timestamp", System.currentTimeMillis().toDouble())
                }
                sendEvent("CallShieldNativeEvent", params)
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
    fun stopCallProtection(promise: Promise) {
        try {
            audioStreamer?.stopStreaming()
            audioStreamer = null

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

    @ReactMethod
    fun getBlockedNumbers(promise: Promise) {
        val array = Arguments.createArray()
        blockedNumbers.forEach { array.pushString(it) }
        promise.resolve(array)
    }
}
