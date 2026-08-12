package com.callshield.app

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

object CallAnalysisConsentNotifier {
    private const val CHANNEL_ID = "callshield_call_consent"
    private const val NOTIFICATION_ID = 301

    fun showAnalyzePrompt(context: Context, phoneNumber: String) {
        createChannel(context)

        if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            return
        }

        val analyzeIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("action", "ANALYZE_CALL")
            putExtra("phoneNumber", phoneNumber)
        }

        val analyzePendingIntent = PendingIntent.getActivity(
            context,
            phoneNumber.hashCode(),
            analyzeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("CallShield incoming call")
            .setContentText("Analyze audio from $phoneNumber?")
            .setStyle(
                NotificationCompat.BigTextStyle().bigText(
                    "Incoming call from $phoneNumber. Tap Yes to open CallShield live monitoring and analyze microphone audio during this call."
                )
            )
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setAutoCancel(true)
            .setContentIntent(analyzePendingIntent)
            .addAction(android.R.drawable.ic_menu_search, "Yes, analyze", analyzePendingIntent)
            .build()

        NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, notification)
    }

    private fun createChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channel = NotificationChannel(
            CHANNEL_ID,
            "CallShield call analysis prompts",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Prompts asking whether CallShield should analyze an active call."
        }
        manager.createNotificationChannel(channel)
    }
}
