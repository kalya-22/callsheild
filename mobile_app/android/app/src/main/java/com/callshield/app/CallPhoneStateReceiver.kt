package com.callshield.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import android.util.Log

class CallPhoneStateReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == TelephonyManager.ACTION_PHONE_STATE_CHANGED) {
            val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
            val incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER) ?: "Unknown Caller"
            Log.d("CallShieldReceiver", "Phone State Changed: $state, Number: $incomingNumber")

            when (state) {
                TelephonyManager.EXTRA_STATE_RINGING -> {
                    CallInterceptorModule.emitCallRinging(incomingNumber)
                    CallAnalysisConsentNotifier.showAnalyzePrompt(context, incomingNumber)
                }
                TelephonyManager.EXTRA_STATE_OFFHOOK -> {
                    CallInterceptorModule.emitCallConnected(incomingNumber)
                }
                TelephonyManager.EXTRA_STATE_IDLE -> {
                    CallInterceptorModule.emitCallEnded(incomingNumber)
                    val serviceIntent = Intent(context, CallAudioStreamerService::class.java)
                    context.stopService(serviceIntent)
                }
            }
        }
    }
}
