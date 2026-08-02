import 'dart:ui';
import 'package:flutter/material.dart';
import '../services/callshield_api.dart';
import 'analytics_screen.dart';
import 'history_screen.dart';
import 'home_screen.dart';
import 'live_detection_screen.dart';
import 'settings_screen.dart';

class NavigationContainer extends StatefulWidget {
  const NavigationContainer({super.key});

  @override
  State<NavigationContainer> createState() => _NavigationContainerState();
}

class _NavigationContainerState extends State<NavigationContainer> {
  int _currentIndex = 0;
  final CallShieldApi _api = CallShieldApi();

  final Color primaryColor = const Color(0xFF2563EB);
  final Color accentColor = const Color(0xFF06B6D4);
  final Color bgDeep = const Color(0xFF070E1A);

  void _onTabTapped(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> screens = [
      HomeScreen(api: _api),
      LiveDetectionScreen(api: _api),
      HistoryScreen(api: _api),
      const AnalyticsScreen(),
      SettingsScreen(api: _api),
    ];

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: Container(
        height: 82, // A bit extra for safe area padding if needed
        decoration: BoxDecoration(
          color: bgDeep.withOpacity(0.97),
          border: Border(
            top: BorderSide(color: Colors.white.withOpacity(0.06), width: 1),
          ),
        ),
        child: ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(0, Icons.home_rounded, 'Home'),
                _buildNavItem(1, Icons.mic_rounded, 'Live'),
                _buildNavItem(2, Icons.history_rounded, 'History'),
                _buildNavItem(3, Icons.analytics_rounded, 'Analytics'),
                _buildNavItem(4, Icons.person_rounded, 'Profile'),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    final bool isActive = _currentIndex == index;

    return Expanded(
      child: InkWell(
        onTap: () => _onTabTapped(index),
        splashColor: Colors.transparent,
        highlightColor: Colors.transparent,
        child: Stack(
          alignment: Alignment.center,
          children: [
            if (isActive)
              Positioned(
                top: 0,
                child: Container(
                  width: 30,
                  height: 2,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [primaryColor, accentColor]),
                    borderRadius: const BorderRadius.vertical(bottom: Radius.circular(3)),
                    boxShadow: [
                      BoxShadow(color: primaryColor, blurRadius: 10),
                    ],
                  ),
                ),
              ),
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  icon,
                  color: isActive ? primaryColor : Colors.white.withOpacity(0.28),
                  size: 24,
                ),
                const SizedBox(height: 4),
                Text(
                  label,
                  style: TextStyle(
                    color: isActive ? primaryColor : Colors.white.withOpacity(0.28),
                    fontSize: 10,
                    fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
