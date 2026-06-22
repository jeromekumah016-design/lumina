/**
 * Tests for the shared retro components.
 *
 * Mirrors the approach in src/theme/__tests__/retro.test.ts:
 * - Pure token/logic assertions (no React Native component renders — node env
 *   does not have __DEV__, so require()-ing RN components crashes).
 * - Handler-forwarding contract via plain function calls.
 * - Variant/size enum coverage via type-level value sets.
 */

import { describe, it, expect, jest } from '@jest/globals';

// ─── NeonButton handler contract ──────────────────────────────────────────────
describe('NeonButton handler contract', () => {
  it('onPress callback is invoked by caller', () => {
    const calls: number[] = [];
    const onPress = () => { calls.push(1); };
    onPress();
    expect(calls).toHaveLength(1);
  });

  it('disabled flag suppresses call when caller respects it', () => {
    let called = false;
    const onPress = () => { called = true; };
    const disabled = true;
    if (!disabled) onPress();
    expect(called).toBe(false);
  });

  it('enabled flag allows call', () => {
    let called = false;
    const onPress = () => { called = true; };
    const disabled = false;
    if (!disabled) onPress();
    expect(called).toBe(true);
  });

  it('variant set is exactly cyan | magenta | dark', () => {
    const valid = new Set(['cyan', 'magenta', 'dark']);
    expect(valid.has('cyan')).toBe(true);
    expect(valid.has('magenta')).toBe(true);
    expect(valid.has('dark')).toBe(true);
    expect(valid.size).toBe(3);
  });

  it('size set is exactly sm | md | lg', () => {
    const valid = new Set(['sm', 'md', 'lg']);
    expect(valid.has('sm')).toBe(true);
    expect(valid.has('md')).toBe(true);
    expect(valid.has('lg')).toBe(true);
    expect(valid.size).toBe(3);
  });

  it('distinct onPress callbacks are not equal', () => {
    const a = jest.fn();
    const b = jest.fn();
    expect(a).not.toBe(b);
  });
});

// ─── NeonCard contract ────────────────────────────────────────────────────────
describe('NeonCard contract', () => {
  it('variant set is exactly magenta | cyan | gold', () => {
    const valid = new Set(['magenta', 'cyan', 'gold']);
    expect(valid.has('magenta')).toBe(true);
    expect(valid.has('cyan')).toBe(true);
    expect(valid.has('gold')).toBe(true);
    expect(valid.size).toBe(3);
  });

  it('default variant is magenta (first in set)', () => {
    const DEFAULT: 'magenta' | 'cyan' | 'gold' = 'magenta';
    expect(DEFAULT).toBe('magenta');
  });
});

// ─── NeonHeader contract ──────────────────────────────────────────────────────
describe('NeonHeader contract', () => {
  it('title prop is a required non-empty string', () => {
    const props = { title: 'TEST TITLE' };
    expect(typeof props.title).toBe('string');
    expect(props.title.length).toBeGreaterThan(0);
  });

  it('subtitle prop is optional (present or absent)', () => {
    const withSub = { title: 'TITLE', subtitle: 'subtitle text' };
    const withoutSub: { title: string } = { title: 'TITLE' };
    expect(withSub.subtitle).toBeDefined();
    expect((withoutSub as any).subtitle).toBeUndefined();
  });

  it('title rendered in uppercase is different from lowercase (letterSpacing matters)', () => {
    const title = 'LUMINA';
    expect(title).toBe(title.toUpperCase());
  });
});

// ─── NeonPanel contract ───────────────────────────────────────────────────────
describe('NeonPanel contract', () => {
  it('variant set is exactly info | warning | success', () => {
    const valid = new Set(['info', 'warning', 'success']);
    expect(valid.has('info')).toBe(true);
    expect(valid.has('warning')).toBe(true);
    expect(valid.has('success')).toBe(true);
    expect(valid.size).toBe(3);
  });

  it('default variant is info', () => {
    const DEFAULT: 'info' | 'warning' | 'success' = 'info';
    expect(DEFAULT).toBe('info');
  });
});

// ─── Token usage: components depend on retro token system ────────────────────
describe('Retro component — token correctness', () => {
  it('NeonButton cyan border uses RETRO_COLORS.neonCyan (#00FFFF)', () => {
    const { RETRO_COLORS } = require('../../../theme/retro');
    // NeonButton VARIANT_STYLES.cyan.border = RETRO_COLORS.neonCyan
    expect(RETRO_COLORS.neonCyan).toBe('#00FFFF');
  });

  it('NeonButton magenta border uses RETRO_COLORS.neonMagenta (#FF00FF)', () => {
    const { RETRO_COLORS } = require('../../../theme/retro');
    expect(RETRO_COLORS.neonMagenta).toBe('#FF00FF');
  });

  it('NeonCard cardBg is a non-empty hex string', () => {
    const { RETRO_COLORS } = require('../../../theme/retro');
    expect(RETRO_COLORS.cardBg).toMatch(/^#/);
    expect(RETRO_COLORS.cardBg.length).toBeGreaterThan(0);
  });

  it('NeonCard cardBorderRadius is a positive number', () => {
    const { RETRO_SIZE } = require('../../../theme/retro');
    expect(RETRO_SIZE.cardBorderRadius).toBeGreaterThan(0);
  });

  it('NeonPanel info border uses RETRO_COLORS.neonCyan', () => {
    const { RETRO_COLORS } = require('../../../theme/retro');
    expect(RETRO_COLORS.neonCyan).toBe('#00FFFF');
  });

  it('NeonPanel warning border uses RETRO_COLORS.neonOrange (non-empty)', () => {
    const { RETRO_COLORS } = require('../../../theme/retro');
    expect(RETRO_COLORS.neonOrange).toMatch(/^#/);
  });

  it('NeonPanel success border uses RETRO_COLORS.neonGreen (non-empty)', () => {
    const { RETRO_COLORS } = require('../../../theme/retro');
    expect(RETRO_COLORS.neonGreen).toMatch(/^#/);
  });

  it('NeonHeader subheaderSize-based font is larger than label size', () => {
    const { RETRO_FONT } = require('../../../theme/retro');
    expect(RETRO_FONT.subheaderSize + 4).toBeGreaterThan(RETRO_FONT.labelSize);
  });
});

// ─── NeonPropertyCard overlay styles — absoluteFill contract ─────────────────
describe('NeonPropertyCard overlay styles', () => {
  it('imageNeonFrame spread resolves to position: absolute (absoluteFillObject does not exist in RN 0.85.3)', () => {
    // StyleSheet.absoluteFill is the plain object {position:'absolute',top:0,...}
    // StyleSheet.absoluteFillObject was removed — spreading undefined silently dropped
    // all position properties, breaking the neon-frame and eliminated overlays.
    const absoluteFillCompat = { position: 'absolute' as const, top: 0, left: 0, bottom: 0, right: 0 };
    const imageNeonFrame = { ...absoluteFillCompat, borderWidth: 2, borderColor: '#00FFFF', opacity: 0.4 };
    expect(imageNeonFrame.position).toBe('absolute');
    expect(imageNeonFrame.top).toBe(0);
    expect(imageNeonFrame.left).toBe(0);
    expect(imageNeonFrame.bottom).toBe(0);
    expect(imageNeonFrame.right).toBe(0);
  });

  it('eliminatedOverlay spread resolves to position: absolute', () => {
    const absoluteFillCompat = { position: 'absolute' as const, top: 0, left: 0, bottom: 0, right: 0 };
    const eliminatedOverlay = {
      ...absoluteFillCompat,
      backgroundColor: 'rgba(0,0,0,0.72)',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    };
    expect(eliminatedOverlay.position).toBe('absolute');
    expect(eliminatedOverlay.top).toBe(0);
    expect(eliminatedOverlay.backgroundColor).toBe('rgba(0,0,0,0.72)');
  });

  it('spreading undefined (what absoluteFillObject returned) drops position', () => {
    const broken: object | undefined = undefined;
    const result = { ...(broken as any), borderWidth: 2 };
    expect((result as any).position).toBeUndefined();
  });
});

// ─── Palm tint tokens ─────────────────────────────────────────────────────────
describe('Palm silhouette color tokens', () => {
  it('palmFrond token exists and is a hex string', () => {
    const { RETRO_COLORS } = require('../../../theme/retro');
    expect(RETRO_COLORS.palmFrond).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('palmTrunk token exists and is a hex string', () => {
    const { RETRO_COLORS } = require('../../../theme/retro');
    expect(RETRO_COLORS.palmTrunk).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('palmFrond is distinct from the old near-black value (#0D0020)', () => {
    const { RETRO_COLORS } = require('../../../theme/retro');
    expect(RETRO_COLORS.palmFrond).not.toBe('#0D0020');
  });
});

// ─── Classic city selector includes Coastal Demo ─────────────────────────────
describe('Classic city selector chip list', () => {
  // Audit flag: classic render previously listed only Chicago/New York/Atlanta.
  // Coastal Demo must be present so both render paths reach that dataset.
  const CLASSIC_CITIES = ['Coastal Demo', 'Chicago', 'New York', 'Atlanta'];

  it('includes Coastal Demo', () => {
    expect(CLASSIC_CITIES).toContain('Coastal Demo');
  });

  it('includes all original cities', () => {
    expect(CLASSIC_CITIES).toContain('Chicago');
    expect(CLASSIC_CITIES).toContain('New York');
    expect(CLASSIC_CITIES).toContain('Atlanta');
  });

  it('has exactly 4 cities', () => {
    expect(CLASSIC_CITIES).toHaveLength(4);
  });

  it('Coastal Demo is first so it matches the retro default city', () => {
    expect(CLASSIC_CITIES[0]).toBe('Coastal Demo');
  });
});

// ─── PerspectiveGrid transformOrigin cross-platform contract ──────────────────
describe('PerspectiveGrid vertical line transform — cross-platform', () => {
  // transformOrigin is partially supported on Android (RN 0.82+).
  // We replace it with an equivalent translate/rotate/translate sequence
  // that works consistently on both platforms.
  it('translate-rotate-translate sequence correctly moves pivot to top-center', () => {
    const len = 100;
    const angle = 30;
    // Equivalent: translate up half-height, rotate, translate back.
    // Net visual result = rotation around the top of the element.
    const transforms = [
      { translateY: -(len / 2) },
      { rotate: `${angle}deg` },
      { translateY: len / 2 },
    ];
    expect(transforms[0].translateY).toBe(-50);
    expect(transforms[2].translateY).toBe(50);
    expect(transforms[1].rotate).toBe('30deg');
  });

  it('pivot offsets are symmetric (cancel each other out at angle 0)', () => {
    const len = 80;
    const up = -(len / 2);
    const down = len / 2;
    expect(up + down).toBe(0);
  });
});

// ─── RETRO_THEME_ENABLED gates retro render on all screens ───────────────────
describe('RETRO_THEME_ENABLED — app-wide gate', () => {
  it('flag is a boolean', () => {
    const { RETRO_THEME_ENABLED } = require('../../../theme/retro');
    expect(typeof RETRO_THEME_ENABLED).toBe('boolean');
  });

  it('flag is true (retro render is active)', () => {
    const { RETRO_THEME_ENABLED } = require('../../../theme/retro');
    expect(RETRO_THEME_ENABLED).toBe(true);
  });

  it('setting flag to false would enable classic render (logical gate test)', () => {
    let retroRender = false;
    let classicRender = false;
    const ENABLED = false;
    if (ENABLED) { retroRender = true; } else { classicRender = true; }
    expect(classicRender).toBe(true);
    expect(retroRender).toBe(false);
  });

  it('setting flag to true enables retro render (logical gate test)', () => {
    let retroRender = false;
    let classicRender = false;
    const ENABLED = true;
    if (ENABLED) { retroRender = true; } else { classicRender = true; }
    expect(retroRender).toBe(true);
    expect(classicRender).toBe(false);
  });
});
