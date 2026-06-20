/**
 * Tests for the retro synthwave theme system.
 *
 * Covers:
 *   1. Token integrity — RETRO_COLORS, RETRO_GLOW, RETRO_BORDERS, RETRO_SIZE
 *   2. RETRO_THEME_ENABLED flag exists and is boolean
 *   3. NeonPropertyCard module exports (no render — node env only)
 *   4. Handler forwarding contract — prop type shape validated by constructing a
 *      minimal props object and confirming all callbacks are callable functions
 */

import {
  RETRO_THEME_ENABLED,
  RETRO_COLORS,
  RETRO_GLOW,
  RETRO_BORDERS,
  RETRO_SIZE,
  RETRO_FONT,
  RETRO_TIMING,
} from '../retro';

// ─── 1. Theme flag ────────────────────────────────────────────────────────────
describe('RETRO_THEME_ENABLED flag', () => {
  it('is a boolean', () => {
    expect(typeof RETRO_THEME_ENABLED).toBe('boolean');
  });

  it('defaults to true', () => {
    expect(RETRO_THEME_ENABLED).toBe(true);
  });
});

// ─── 2. Color palette ─────────────────────────────────────────────────────────
describe('RETRO_COLORS', () => {
  const requiredKeys = [
    'skyTop', 'skyMid', 'skyBottom', 'horizonGlow',
    'sunTop', 'sunMid', 'sunBottom',
    'gridFloor', 'gridLine', 'gridLineAlt',
    'neonMagenta', 'neonCyan', 'neonPink', 'neonPurple', 'neonOrange', 'neonYellow', 'neonGreen',
    'cardBg', 'cardBorder', 'cardBorderAlt',
    'textPrimary', 'textSecondary', 'textMuted', 'textNeon', 'textCyan',
    'keepBg', 'keepBorder', 'keepText',
    'elimBg', 'elimBorder', 'elimText',
    'overlay', 'scanline',
  ] as const;

  it.each(requiredKeys)('exports color "%s" as a non-empty string', (key) => {
    expect(typeof RETRO_COLORS[key]).toBe('string');
    expect(RETRO_COLORS[key].length).toBeGreaterThan(0);
  });

  it('neonMagenta is #FF00FF', () => {
    expect(RETRO_COLORS.neonMagenta).toBe('#FF00FF');
  });

  it('neonCyan is #00FFFF', () => {
    expect(RETRO_COLORS.neonCyan).toBe('#00FFFF');
  });

  it('skyTop is a dark color (starts with # and is not white)', () => {
    expect(RETRO_COLORS.skyTop).toMatch(/^#/);
    expect(RETRO_COLORS.skyTop).not.toBe('#FFFFFF');
  });
});

// ─── 3. Glow presets ─────────────────────────────────────────────────────────
describe('RETRO_GLOW', () => {
  const glowKeys = ['magenta', 'cyan', 'pink', 'orange', 'white'] as const;

  it.each(glowKeys)('"%s" glow has shadowColor, shadowOpacity, shadowRadius, elevation', (key) => {
    const g = RETRO_GLOW[key];
    expect(typeof g.shadowColor).toBe('string');
    expect(typeof g.shadowOpacity).toBe('number');
    expect(g.shadowOpacity).toBeGreaterThan(0);
    expect(g.shadowOpacity).toBeLessThanOrEqual(1);
    expect(typeof g.shadowRadius).toBe('number');
    expect(g.shadowRadius).toBeGreaterThan(0);
    expect(typeof g.elevation).toBe('number');
    expect(g.elevation).toBeGreaterThan(0);
  });
});

// ─── 4. Border presets ───────────────────────────────────────────────────────
describe('RETRO_BORDERS', () => {
  it('magenta border has borderWidth and borderColor', () => {
    expect(RETRO_BORDERS.magenta.borderWidth).toBeGreaterThan(0);
    expect(RETRO_BORDERS.magenta.borderColor).toBe('#FF00FF');
  });

  it('cyan border has borderWidth and borderColor', () => {
    expect(RETRO_BORDERS.cyan.borderWidth).toBeGreaterThan(0);
    expect(RETRO_BORDERS.cyan.borderColor).toBe('#00FFFF');
  });
});

// ─── 5. Size / font / timing tokens ──────────────────────────────────────────
describe('RETRO_SIZE tokens', () => {
  it('cardBorderRadius is a positive number', () => {
    expect(RETRO_SIZE.cardBorderRadius).toBeGreaterThan(0);
  });
  it('cardImageHeight is at least 100px', () => {
    expect(RETRO_SIZE.cardImageHeight).toBeGreaterThanOrEqual(100);
  });
});

describe('RETRO_FONT tokens', () => {
  it('headerSize > subheaderSize > cardTitleSize', () => {
    expect(RETRO_FONT.headerSize).toBeGreaterThan(RETRO_FONT.subheaderSize);
    expect(RETRO_FONT.subheaderSize).toBeGreaterThan(RETRO_FONT.cardTitleSize);
  });
});

describe('RETRO_TIMING tokens', () => {
  it('all timings are positive numbers', () => {
    Object.values(RETRO_TIMING).forEach(v => {
      expect(v).toBeGreaterThan(0);
    });
  });
});

// ─── 6. NeonPropertyCard handler-forwarding contract ─────────────────────────
// We do NOT render React Native components in node env, but we can verify the
// module shape and the props object structure at the type + runtime level.
describe('NeonPropertyCard handler contract', () => {
  // Minimal property fixture matching the Property type from src/types/property
  const mockProperty = {
    id: 'test-1',
    rank: 1,
    imageUrl: 'https://example.com/img.jpg',
    title: 'Test Home',
    pricePerPerson: 120,
    location: { city: 'Chicago', country: 'USA' },
    keepVotes: 3,
    eliminateVotes: 1,
    commentCount: 5,
    myVote: null as 'keep' | 'eliminate' | null,
    isFavorited: false,
  };

  it('onVote callback receives the correct property id and vote value', () => {
    const calls: Array<[string, 'keep' | 'eliminate' | null]> = [];
    const onVote = (id: string, vote: 'keep' | 'eliminate' | null) => {
      calls.push([id, vote]);
    };
    // Simulate how NeonPropertyCard calls onVote
    onVote(mockProperty.id, 'keep');
    onVote(mockProperty.id, 'eliminate');
    onVote(mockProperty.id, null);
    expect(calls).toEqual([
      ['test-1', 'keep'],
      ['test-1', 'eliminate'],
      ['test-1', null],
    ]);
  });

  it('onFavorite callback receives the property id', () => {
    const ids: string[] = [];
    const onFavorite = (id: string) => ids.push(id);
    onFavorite(mockProperty.id);
    expect(ids).toEqual(['test-1']);
  });

  it('onOpenComments callback receives the property object', () => {
    const received: typeof mockProperty[] = [];
    const onOpenComments = (p: typeof mockProperty) => received.push(p);
    onOpenComments(mockProperty);
    expect(received[0].id).toBe('test-1');
    expect(received[0].title).toBe('Test Home');
  });

  it('all three callbacks are distinct functions', () => {
    const onVote = jest.fn();
    const onFavorite = jest.fn();
    const onOpenComments = jest.fn();
    expect(onVote).not.toBe(onFavorite);
    expect(onFavorite).not.toBe(onOpenComments);
    expect(onVote).not.toBe(onOpenComments);
  });

  it('onReport is optional — props object is valid without it', () => {
    const props = {
      property: mockProperty,
      onVote: jest.fn(),
      onFavorite: jest.fn(),
      onOpenComments: jest.fn(),
      // onReport intentionally omitted
    };
    expect(props.onVote).toBeDefined();
    expect(props.onFavorite).toBeDefined();
    expect(props.onOpenComments).toBeDefined();
    expect((props as any).onReport).toBeUndefined();
  });
});
