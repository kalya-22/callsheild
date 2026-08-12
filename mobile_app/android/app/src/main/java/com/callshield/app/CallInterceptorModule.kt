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

        fun emitCallRinging(phoneNumber: String) {
            val params = Arguments.createMap().apply {
                putString("phoneNumber", phoneNumber)
                putString("event", "ON_CALL_RINGING")
            }
            instance?.sendEvent("CallShieldNativeEvent", params)
        }

        fun emitCallEnded(phoneNumber: String) {
            val params = Arguments.createMap().apply {
                putString("phoneNumber", phoneNumber)
                putString("event", "ON_CALL_ENDED")
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
    fun startCallProtection(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, CallAudioStreamerService::class.java)
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
