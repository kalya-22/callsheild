package com.callshield.app

import android.os.Build
import android.telecom.Call
import android.telecom.CallScreeningService
import androidx.annotation.RequiresApi

@RequiresApi(Build.VERSION_CODES.Q)
class CallShieldScreeningService : CallScreeningService() {

    override fun onScreenCall(callDetails: Call.Details) {
        val phoneNumber = callDetails.handle?.schemeSpecificPart ?: ""
        
        // Notify native module of incoming call screening event
        CallInterceptorModule.emitCallRinging(phoneNumber)

        val response = CallResponse.Builder()
        
        // If caller number matches known scam database, reject call automatically
        if (CallInterceptorModule.isNumberBlocked(phoneNumber)) {
            response.setDisallowCall(true)
            response.setRejectCall(true)
            response.setSkipCallLog(false)
            response.setSkipNotification(false)
        } else {
            response.setDisallowCall(false)
        }

        respondToCall(callDetails, response.build())
    }
}
