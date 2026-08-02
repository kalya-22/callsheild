import 'package:flutter/material.dart';
import '../widgets/glass_card.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  String _tab = 'login'; // 'login' or 'signup'
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();
  bool _isLoading = false;

  final Color primaryColor = const Color(0xFF2563EB);
  final Color accentColor = const Color(0xFF06B6D4);
  final Color textMuted = Colors.white.withOpacity(0.38);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background Glow
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              height: 400,
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: const Alignment(0, -0.6),
                  radius: 1.0,
                  colors: [primaryColor.withOpacity(0.12), Colors.transparent],
                ),
              ),
            ),
          ),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                children: [
                  const SizedBox(height: 40),
                  _buildLogo(),
                  const SizedBox(height: 24),
                  _buildHeader(),
                  const SizedBox(height: 32),
                  _buildTabSwitcher(),
                  const SizedBox(height: 32),
                  _buildForm(),
                  const SizedBox(height: 24),
                  _buildFooter(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLogo() {
    return Container(
      width: 64,
      height: 64,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [primaryColor, accentColor],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: primaryColor.withOpacity(0.4), blurRadius: 20, offset: const Offset(0, 8)),
        ],
      ),
      child: const Icon(Icons.shield_rounded, color: Colors.white, size: 36),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        Text(
          _tab == 'login' ? 'Welcome Back' : 'Create Account',
          style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Text(
          _tab == 'login' ? 'Secure your calls with AI protection' : 'Start protecting your calls today',
          style: TextStyle(color: textMuted, fontSize: 14),
        ),
      ],
    );
  }

  Widget _buildTabSwitcher() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Row(
        children: [
          _buildTabButton('login', 'Sign In'),
          _buildTabButton('signup', 'Sign Up'),
        ],
      ),
    );
  }

  Widget _buildTabButton(String id, String label) {
    final bool isActive = _tab == id;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _tab = id),
        borderRadius: BorderRadius.circular(11),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 11),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(11),
            gradient: isActive ? LinearGradient(colors: [primaryColor, const Color(0xFF1D4ED8)]) : null,
            boxShadow: isActive ? [BoxShadow(color: primaryColor.withOpacity(0.3), blurRadius: 16, offset: const Offset(0, 4))] : null,
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                color: isActive ? Colors.white : textMuted,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_tab == 'signup') ...[
          _buildLabel('Full Name'),
          _buildInput(_nameController, 'Alex Johnson', Icons.person_outline),
          const SizedBox(height: 16),
        ],
        _buildLabel('Email Address'),
        _buildInput(_emailController, 'your@email.com', Icons.email_outlined),
        const SizedBox(height: 16),
        _buildLabel('Password'),
        _buildInput(_passwordController, '••••••••', Icons.lock_outline, isPassword: true),
        if (_tab == 'login')
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () {},
              child: Text('Forgot password?', style: TextStyle(color: accentColor, fontSize: 13, fontWeight: FontWeight.w500)),
            ),
          ),
        const SizedBox(height: 24),
        _buildSubmitButton(),
        const SizedBox(height: 24),
        _buildDivider(),
        const SizedBox(height: 24),
        _buildSocialButtons(),
      ],
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text.toUpperCase(),
        style: TextStyle(color: textMuted, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 0.8),
      ),
    );
  }

  Widget _buildInput(TextEditingController controller, String hint, IconData icon, {bool isPassword = false}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
        borderRadius: BorderRadius.circular(14),
      ),
      child: TextField(
        controller: controller,
        obscureText: isPassword,
        style: const TextStyle(color: Colors.white, fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: textMuted.withOpacity(0.5)),
          prefixIcon: Icon(icon, color: textMuted, size: 20),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
      ),
    );
  }

  Widget _buildSubmitButton() {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: primaryColor.withOpacity(0.4), blurRadius: 32, offset: const Offset(0, 8)),
        ],
      ),
      child: ElevatedButton(
        onPressed: () {
          // Add navigation to home
          Navigator.pushReplacementNamed(context, '/home');
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ).copyWith(
          backgroundColor: MaterialStateProperty.all(Colors.transparent),
        ),
        child: Ink(
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [primaryColor, accentColor]),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Container(
            alignment: Alignment.center,
            child: Text(
              _tab == 'login' ? 'Sign In Securely' : 'Create Account',
              style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDivider() {
    return Row(
      children: [
        Expanded(child: Container(height: 1, color: Colors.white.withOpacity(0.08))),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text('or continue with', style: TextStyle(color: textMuted, fontSize: 12)),
        ),
        Expanded(child: Container(height: 1, color: Colors.white.withOpacity(0.08))),
      ],
    );
  }

  Widget _buildSocialButtons() {
    return Row(
      children: [
        Expanded(
          child: GlassCard(
            padding: const EdgeInsets.symmetric(vertical: 14),
            onTap: () {},
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.g_mobiledata, color: Colors.white, size: 24),
                SizedBox(width: 8),
                Text('Google', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: GlassCard(
            padding: const EdgeInsets.symmetric(vertical: 14),
            onTap: () {},
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.face_unlock_outlined, color: accentColor, size: 20),
                const SizedBox(width: 8),
                const Text('Face ID', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFooter() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Text(
        'Protected by 256-bit AES encryption • SOC 2 Certified',
        textAlign: TextAlign.center,
        style: TextStyle(color: textMuted, fontSize: 11),
      ),
    );
  }
}
