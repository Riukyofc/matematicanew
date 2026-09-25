import 'package:flutter/material.dart';

/// MathEduca — Dark Theme com acentos neon
/// Tema premium para a plataforma educacional de matemática
class AppTheme {
  AppTheme._();

  // ============================================================
  // CORES NEON
  // ============================================================
  static const Color neonPurple = Color(0xFF8B5CF6);
  static const Color neonBlue = Color(0xFF3B82F6);
  static const Color neonCyan = Color(0xFF06B6D4);
  static const Color neonPink = Color(0xFFEC4899);
  static const Color neonGreen = Color(0xFF10B981);

  // Background
  static const Color bgPrimary = Color(0xFF0A0A1A);
  static const Color bgSecondary = Color(0xFF111128);
  static const Color bgCard = Color(0xFF1A1A3E);
  static const Color bgSurface = Color(0xFF16163A);
  static const Color bgInput = Color(0xFF1E1E48);

  // Texto
  static const Color textPrimary = Color(0xFFF1F5F9);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFF64748B);

  // Bordas
  static const Color borderDefault = Color(0xFF2D2D5E);
  static const Color borderFocus = neonPurple;

  // ============================================================
  // GRADIENTES
  // ============================================================
  static const LinearGradient neonGradient = LinearGradient(
    colors: [neonPurple, neonBlue],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient cardGradient = LinearGradient(
    colors: [bgCard, bgSurface],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // ============================================================
  // BOX SHADOWS (GLOW NEON)
  // ============================================================
  static List<BoxShadow> neonGlow({
    Color color = neonPurple,
    double blurRadius = 20,
    double spreadRadius = 0,
  }) {
    return [
      BoxShadow(
        color: color.withOpacity(0.4),
        blurRadius: blurRadius,
        spreadRadius: spreadRadius,
      ),
    ];
  }

  // ============================================================
  // THEME DATA
  // ============================================================
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: bgPrimary,
      fontFamily: 'Inter',

      // Color Scheme
      colorScheme: const ColorScheme.dark(
        primary: neonPurple,
        secondary: neonBlue,
        surface: bgSurface,
        error: Color(0xFFEF4444),
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: textPrimary,
        onError: Colors.white,
      ),

      // AppBar
      appBarTheme: const AppBarTheme(
        backgroundColor: bgPrimary,
        foregroundColor: textPrimary,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          fontFamily: 'Inter',
          fontWeight: FontWeight.w700,
          fontSize: 18,
          color: textPrimary,
          letterSpacing: -0.3,
        ),
      ),

      // TabBar
      tabBarTheme: TabBarTheme(
        labelColor: neonPurple,
        unselectedLabelColor: textSecondary,
        indicatorSize: TabBarIndicatorSize.label,
        indicator: BoxDecoration(
          border: Border(
            bottom: BorderSide(color: neonPurple, width: 3),
          ),
        ),
        labelStyle: const TextStyle(
          fontFamily: 'Inter',
          fontWeight: FontWeight.w600,
          fontSize: 14,
        ),
        unselectedLabelStyle: const TextStyle(
          fontFamily: 'Inter',
          fontWeight: FontWeight.w400,
          fontSize: 14,
        ),
      ),

      // Cards
      cardTheme: CardTheme(
        color: bgCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: borderDefault, width: 1),
        ),
      ),

      // Input Fields
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: bgInput,
        hintStyle: const TextStyle(color: textMuted),
        labelStyle: const TextStyle(color: textSecondary),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: borderDefault),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: borderDefault),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: neonPurple, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFEF4444)),
        ),
      ),

      // Elevated Buttons
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: neonPurple,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontFamily: 'Inter',
            fontWeight: FontWeight.w600,
            fontSize: 15,
            letterSpacing: 0.3,
          ),
        ),
      ),

      // Floating Action Button
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: neonPurple,
        foregroundColor: Colors.white,
        elevation: 8,
      ),

      // Divider
      dividerTheme: const DividerThemeData(
        color: borderDefault,
        thickness: 1,
      ),

      // Chip
      chipTheme: ChipThemeData(
        backgroundColor: bgInput,
        labelStyle: const TextStyle(color: textPrimary, fontSize: 13),
        side: const BorderSide(color: borderDefault),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),

      // Text Theme
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          fontFamily: 'Inter',
          fontWeight: FontWeight.w800,
          fontSize: 28,
          color: textPrimary,
          letterSpacing: -0.5,
        ),
        headlineMedium: TextStyle(
          fontFamily: 'Inter',
          fontWeight: FontWeight.w700,
          fontSize: 22,
          color: textPrimary,
          letterSpacing: -0.3,
        ),
        headlineSmall: TextStyle(
          fontFamily: 'Inter',
          fontWeight: FontWeight.w600,
          fontSize: 18,
          color: textPrimary,
        ),
        titleLarge: TextStyle(
          fontFamily: 'Inter',
          fontWeight: FontWeight.w600,
          fontSize: 16,
          color: textPrimary,
        ),
        titleMedium: TextStyle(
          fontFamily: 'Inter',
          fontWeight: FontWeight.w500,
          fontSize: 14,
          color: textPrimary,
        ),
        bodyLarge: TextStyle(
          fontFamily: 'Inter',
          fontWeight: FontWeight.w400,
          fontSize: 16,
          color: textSecondary,
          height: 1.6,
        ),
        bodyMedium: TextStyle(
          fontFamily: 'Inter',
          fontWeight: FontWeight.w400,
          fontSize: 14,
          color: textSecondary,
          height: 1.5,
        ),
        bodySmall: TextStyle(
          fontFamily: 'Inter',
          fontWeight: FontWeight.w400,
          fontSize: 12,
          color: textMuted,
        ),
        labelLarge: TextStyle(
          fontFamily: 'Inter',
          fontWeight: FontWeight.w600,
          fontSize: 14,
          color: textPrimary,
        ),
      ),
    );
  }
}
