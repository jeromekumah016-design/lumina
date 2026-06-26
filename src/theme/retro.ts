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
  // Sky / background layers — deep navy night
  skyTop: '#04000F',        // near-black deep space
  skyMid: '#080020',        // dark indigo layer
  skyBottom: '#0E0030',     // deep violet at horizon
  horizonGlow: '#FF0090',   // vivid hot magenta at horizon line

  // Sun
  sunTop: '#FF6B35',        // orange top of the synthwave sun
  sunMid: '#FF1088',        // vivid neon pink mid sun
  sunBottom: '#8020FF',     // electric purple base of sun

  // Grid floor
  gridFloor: '#080018',     // very dark grid base
  gridLine: '#FF00FF',      // neon magenta grid lines
  gridLineAlt: '#00FFFF',   // cyan cross lines

  // Neon accents — vivid, photo-accurate
  neonMagenta: '#FF00FF',
  neonCyan: '#00FFFF',
  neonPink: '#FF1088',
  neonPurple: '#AA00FF',
  neonOrange: '#FF6B35',
  neonYellow: '#FFE600',
  neonGreen: '#39FF14',

  // Skyline silhouette
  skylineBuilding: '#080020',   // very dark purple building silhouette
  skylinePurple: '#1A0050',     // slightly lighter purple for skyline depth
  windowCyan: 'rgba(0,255,255,0.85)',
  windowMagenta: 'rgba(255,0,255,0.85)',
  windowYellow: 'rgba(255,200,0,0.7)',

  // Palm silhouettes — purple-tinted (not pitch-black)
  palmTrunk: '#150038',
  palmFrond: '#1E0050',

  // Card surfaces
  cardBg: '#0A0028',        // very dark purple card background
  cardBorder: '#FF00FF',    // neon magenta border
  cardBorderAlt: '#00FFFF',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#D8B8FF', // bright lavender
  textMuted: '#8060A0',     // muted purple
  textNeon: '#FF00FF',
  textCyan: '#00FFFF',

  // Buttons
  keepBg: '#000E20',
  keepBorder: '#00FFFF',
  keepActive: '#002840',
  keepText: '#00FFFF',
  elimBg: '#200010',
  elimBorder: '#FF00FF',
  elimActive: '#380028',
  elimText: '#FF00FF',

  // Overlays
  overlay: 'rgba(4, 0, 15, 0.88)',
  scanline: 'rgba(0, 0, 0, 0.12)',
} as const;

// ─── Glow / shadow presets — stronger than v1 ─────────────────────────────────
export const RETRO_GLOW = {
  magenta: {
    shadowColor: '#FF00FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1.0,
    shadowRadius: 18,
    elevation: 14,
  },
  cyan: {
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1.0,
    shadowRadius: 16,
    elevation: 12,
  },
  pink: {
    shadowColor: '#FF1088',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 22,
    elevation: 16,
  },
  orange: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 12,
    elevation: 8,
  },
  yellow: {
    shadowColor: '#FFE600',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 10,
  },
  purple: {
    shadowColor: '#AA00FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 14,
    elevation: 10,
  },
  white: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
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
  gridScroll: 2400,      // ms per grid scroll loop (faster = more dynamic)
  heartPop: 160,
  scanlineDrift: 8000,
} as const;
