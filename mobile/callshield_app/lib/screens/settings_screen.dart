import 'package:flutter/material.dart';
import '../services/callshield_api.dart';
import '../widgets/glass_card.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({
    required this.api,
    super.key,
  });

  final CallShieldApi api;

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _darkMode = true;
  bool _autoDetect = true;
  bool _notifications = true;
  bool _vibrate = true;
  bool _biometric = true;
  double _sensitivity = 70;
  String _language = 'English';

  final Color primaryColor = const Color(0xFF2563EB);
  final Color accentColor = const Color(0xFF06B6D4);
  final Color successColor = const Color(0xFF22C55E);
  final Color warningColor = const Color(0xFFF59E0B);
  final Color dangerColor = const Color(0xFFEF4444);
  final Color textMuted = Colors.white.withOpacity(0.38);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          SafeArea(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              children: [
                _buildHeader(),
                _buildSectionHeader('Appearance'),
                GlassCard(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: [
                      _buildSettingRow('🌙', 'Dark Mode', 'Deep navy UI',
                        _buildToggle(_darkMode, (v) => setState(() => _darkMode = v))),
                      _buildSettingRow('🌐', 'Language', _language,
                        _buildDropdown()),
                    ],
                  ),
                ),
                _buildSectionHeader('Detection'),
                GlassCard(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: [
                      _buildSettingRow('🤖', 'Auto-Detect Calls', 'Analyze calls automatically',
                        _buildToggle(_autoDetect, (v) => setState(() => _autoDetect = v), color: accentColor)),
                      _buildSensitivitySlider(),
                    ],
                  ),
                ),
                _buildSectionHeader('Notifications'),
                GlassCard(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: [
                      _buildSettingRow('🔔', 'Push Notifications', 'Scam alerts & updates',
                        _buildToggle(_notifications, (v) => setState(() => _notifications = v), color: warningColor)),
                      _buildSettingRow('📳', 'Vibration', 'Haptic feedback on alerts',
                        _buildToggle(_vibrate, (v) => setState(() => _vibrate = v))),
                    ],
                  ),
                ),
                _buildSectionHeader('Security & Privacy'),
                GlassCard(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: [
                      _buildSettingRow('👤', 'Biometric Login', 'Face ID / Fingerprint',
                        _buildToggle(_biometric, (v) => setState(() => _biometric = v), color: successColor)),
                      _buildActionRow('🚫', 'Blocked Contacts', '5 numbers blocked'),
                      _buildActionRow('🔐', 'Manage Permissions', 'Microphone, phone state'),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: dangerColor.withOpacity(0.1),
                    foregroundColor: dangerColor,
                    elevation: 0,
                    side: BorderSide(color: dangerColor.withOpacity(0.2)),
                    minimumSize: const Size(double.infinity, 54),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Sign Out', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
                const SizedBox(height: 100),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 10),
      child: Text(
        'Settings',
        style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 20, 0, 8),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(color: textMuted, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1),
      ),
    );
  }

  Widget _buildSettingRow(String icon, String label, String sub, Widget right) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.05), width: 1)),
      ),
      child: Row(
        children: [
          _buildIconBox(icon),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500)),
                Text(sub, style: TextStyle(color: textMuted, fontSize: 11)),
              ],
            ),
          ),
          right,
        ],
      ),
    );
  }

  Widget _buildActionRow(String icon, String label, String sub) {
    return _buildSettingRow(icon, label, sub, Icon(Icons.chevron_right, color: textMuted, size: 20));
  }

  Widget _buildIconBox(String icon) {
    return Container(
      width: 38,
      height: 38,
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.06),
        borderRadius: BorderRadius.circular(12),
      ),
      alignment: Alignment.center,
      child: Text(icon, style: const TextStyle(fontSize: 18)),
    );
  }

  Widget _buildToggle(bool value, Function(bool) onChanged, {Color? color}) {
    return Switch(
      value: value,
      onChanged: onChanged,
      activeColor: Colors.white,
      activeTrackColor: color ?? primaryColor,
      inactiveThumbColor: Colors.white,
      inactiveTrackColor: Colors.white.withOpacity(0.1),
    );
  }

  Widget _buildDropdown() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white.withOpacity(0.12)),
      ),
      child: DropdownButton<String>(
        value: _language,
        underline: const SizedBox(),
        dropdownColor: const Color(0xFF1E293B),
        style: const TextStyle(color: Colors.white, fontSize: 12),
        items: ['English', 'Spanish', 'Hindi'].map((String value) {
          return DropdownMenuItem<String>(
            value: value,
            child: Text(value),
          );
        }).toList(),
        onChanged: (v) => setState(() => _language = v!),
      ),
    );
  }

  Widget _buildSensitivitySlider() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _buildIconBox('🎯'),
              const SizedBox(width: 14),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Detection Sensitivity', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500)),
                  Text(
                    '${_sensitivity < 40 ? 'Lenient' : _sensitivity < 70 ? 'Balanced' : 'Strict'} · ${_sensitivity.round()}%',
                    style: TextStyle(color: textMuted, fontSize: 11),
                  ),
                ],
              ),
            ],
          ),
          Slider(
            value: _sensitivity,
            min: 0,
            max: 100,
            activeColor: primaryColor,
            inactiveColor: Colors.white.withOpacity(0.1),
            onChanged: (v) => setState(() => _sensitivity = v),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Lenient', style: TextStyle(color: textMuted, fontSize: 10)),
              Text('Strict', style: TextStyle(color: textMuted, fontSize: 10)),
            ],
          ),
        ],
      ),
    );
  }
}
