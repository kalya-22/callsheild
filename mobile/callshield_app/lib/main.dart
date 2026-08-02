import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'screens/navigation_container.dart';

void main() {
  runApp(const CallShieldApp());
}

class CallShieldApp extends StatelessWidget {
  const CallShieldApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CallShield - AI Voice Detection',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF2563EB),
          secondary: Color(0xFF06B6D4),
          surface: Color(0xFF1E293B),
          error: Color(0xFFEF4444),
          onPrimary: Colors.white,
          onSecondary: Colors.white,
          onSurface: Colors.white,
        ),
        useMaterial3: true,
        textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme),
      ),
      home: const NavigationContainer(),
    );
  }
}
