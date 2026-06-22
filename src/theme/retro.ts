/**
 * Retro Synthwave / Outrun design-token system for Lumina.
 *
 * Flip RETRO_THEME_ENABLED to false to revert every screen to the default look.
 * All components in src/components/retro/ read from these tokens so a single
 * color change propagates everywhere automatically.
 */

export const RETRO_THEME_ENABLED = true;

// ─── Color palette ────────────────────────────────────────────────────────────
export const RETRO_COLORS = {
  // Sky / background layers
  skyTop: '#0A0020',       // deep space purple-black
  skyMid: '#0D0035',       // dark indigo
  skyBottom: '#1A0040',    // night violet at horizon
  horizonGlow: '#FF1493',  // hot neon magenta at horizon line
  sunTop: '#FF6B35',       // orange top of the synthwave sun
  sunMid: '#FF1493',       // neon pink mid sun
  sunBottom: '#9B30FF',    // purple base of sun

  // Grid floor
  gridFloor: '#0D0035',    // dark grid base
  gridLine: '#FF00FF',     // neon magenta grid lines
  gridLineAlt: '#00FFFF',  // cyan cross lines

  // Neon accents
  neonMagenta: '#FF00FF',
  neonCyan: '#00FFFF',
  neonPink: '#FF1493',
  neonPurple: '#9B30FF',
  neonOrange: '#FF6B35',
  neonYellow: '#FFE600',
  neonGreen: '#39FF14',

  // Card surfaces
  cardBg: '#0F0030',       // very dark purple card background
  cardBorder: '#FF00FF',   // neon magenta border
  cardBorderAlt: '#00FFFF',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#E0C0FF', // soft lavender
  textMuted: '#A080C0',     // muted purple
  textNeon: '#FF00FF',
  textCyan: '#00FFFF',

  // Buttons
  keepBg: '#001A2E',
  keepBorder: '#00FFFF',
  keepActive: '#003040',
  keepText: '#00FFFF',
  elimBg: '#2E001A',
  elimBorder: '#FF00FF',
  elimActive: '#400030',
  elimText: '#FF00FF',

  // Palm silhouettes — neon purple/magenta tint (token-driven for easy tuning)
  palmFrond: '#2B0060',   // deep purple-magenta frond silhouette
  palmTrunk: '#1A003A',   // slightly lighter purple trunk

  // Overlays
  overlay: 'rgba(10, 0, 32, 0.85)',
  scanline: 'rgba(0, 0, 0, 0.15)',
} as const;

// ─── Glow / shadow presets ────────────────────────────────────────────────────
export const RETRO_GLOW = {
  // React Native shadowColor + elevation combos (iOS shadow / Android elevation)
  magenta: {
    shadowColor: '#FF00FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 10,
  },
  cyan: {
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
  pink: {
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 14,
    elevation: 12,
  },
  orange: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 6,
  },
  white: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
} as const;

// ─── Neon border presets ──────────────────────────────────────────────────────
export const RETRO_BORDERS = {
  magenta: { borderWidth: 2, borderColor: '#FF00FF' },
  cyan: { borderWidth: 2, borderColor: '#00FFFF' },
  magentaThick: { borderWidth: 3, borderColor: '#FF00FF' },
  cyanThick: { borderWidth: 3, borderColor: '#00FFFF' },
  double: { borderWidth: 2, borderColor: '#FF00FF' },
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
export const RETRO_FONT = {
  headerSize: 28,
  subheaderSize: 18,
  cardTitleSize: 15,
  labelSize: 12,
  microSize: 10,
  countdownSize: 24,
  letterSpacing: 3,
  letterSpacingWide: 6,
} as const;

// ─── Spacing / sizing ─────────────────────────────────────────────────────────
export const RETRO_SIZE = {
  cardBorderRadius: 16,
  buttonBorderRadius: 8,
  badgeBorderRadius: 6,
  cardPadding: 12,
  cardImageHeight: 180,
} as const;

// ─── Animation timing ─────────────────────────────────────────────────────────
export const RETRO_TIMING = {
  starTwinkle: 1800,     // ms per twinkle cycle
  gridScroll: 3000,      // ms per grid scroll loop
  heartPop: 160,
  scanlineDrift: 8000,
} as const;
