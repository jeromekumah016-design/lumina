/**
 * SynthwaveBackground
 *
 * Animated retro Outrun / synthwave scene rendered entirely with React Native
 * Views and Reanimated — no images, no SVG, no gradient library required.
 *
 * Layers (bottom-up):
 *   1. Deep sky gradient (layered dark Views)
 *   2. Twinkling stars (randomly placed dots, opacity Animated loop)
 *   3. Glowing sunset "sun" (circle with layered glow halos)
 *   4. Palm-tree silhouettes (composed View shapes)
 *   5. Scrolling perspective grid floor (horizontal line sets with perspective)
 *   6. Subtle scanline overlay
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { RETRO_COLORS, RETRO_TIMING } from '../../theme/retro';

const { width: W, height: H } = Dimensions.get('window');

// ─── Star positions (generated once, stable across renders) ──────────────────
const STARS: { x: number; y: number; size: number; delay: number }[] = Array.from(
  { length: 60 },
  (_, i) => ({
    x: ((i * 127 + 37) % 97) / 97,    // pseudo-random 0-1 based on index
    y: ((i * 83 + 19) % 89) / 89,
    size: i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1,
    delay: (i * 233) % RETRO_TIMING.starTwinkle,
  })
);

// ─── Grid line definitions ────────────────────────────────────────────────────
// Each line has a vertical position (0 = horizon, 1 = near edge)
// and an apparent width that grows with perspective
const GRID_ROWS = 10;
const GRID_COLS = 8;

// ─── Star component ───────────────────────────────────────────────────────────
function Star({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration: RETRO_TIMING.starTwinkle / 2, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.2, duration: RETRO_TIMING.starTwinkle / 2, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, opacity]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x * W,
        top: y * (H * 0.42), // only in sky area
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#FFFFFF',
        opacity,
      }}
    />
  );
}

// ─── Sun component ────────────────────────────────────────────────────────────
function SynthwaveSun({ upperLeft = false }: { upperLeft?: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.97, duration: 2000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const SUN_R = 72;
  const cx = upperLeft ? W * 0.18 : W / 2;
  const sunTop = upperLeft ? H * 0.1 : H * 0.28; // upper-left or centered

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: cx - SUN_R * 1.8,
        top: sunTop - SUN_R * 1.8,
        width: SUN_R * 3.6,
        height: SUN_R * 3.6,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale: pulse }],
      }}
    >
      {/* Outer glow halos */}
      {[3.0, 2.5, 2.1, 1.8].map((scale, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: SUN_R * 2 * scale,
            height: SUN_R * 2 * scale,
            borderRadius: SUN_R * scale,
            backgroundColor:
              i === 0 ? 'rgba(155,48,255,0.08)' :
              i === 1 ? 'rgba(255,0,255,0.12)' :
              i === 2 ? 'rgba(255,20,147,0.18)' :
              'rgba(255,107,53,0.22)',
          }}
        />
      ))}
      {/* Sun body — split into top/bottom halves with different colors */}
      <View
        style={{
          width: SUN_R * 2,
          height: SUN_R * 2,
          borderRadius: SUN_R,
          overflow: 'hidden',
          backgroundColor: RETRO_COLORS.sunTop,
        }}
      >
        {/* Bottom half: deep magenta gradient stripe band */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: SUN_R, backgroundColor: RETRO_COLORS.sunMid }} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: SUN_R * 0.6, backgroundColor: RETRO_COLORS.sunBottom }} />
        {/* Horizontal scanlines across the sun body */}
        {[0, 1, 2, 3, 4].map(i => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: 0, right: 0,
              top: SUN_R + (i * (SUN_R / 5)) + 2,
              height: 3,
              backgroundColor: 'rgba(10,0,32,0.5)',
            }}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// ─── City skyline silhouette ─────────────────────────────────────────────────
// Simple building silhouettes sitting at the horizon line, between the sun
// and the palm trees. Neon-edged dark shapes with tiny window lights.
const SKYLINE_BUILDINGS: { xFrac: number; wFrac: number; h: number }[] = [
  { xFrac: 0.00, wFrac: 0.055, h: 44 },
  { xFrac: 0.04, wFrac: 0.035, h: 64 },
  { xFrac: 0.07, wFrac: 0.06,  h: 50 },
  { xFrac: 0.12, wFrac: 0.04,  h: 80 },
  { xFrac: 0.15, wFrac: 0.05,  h: 58 },
  { xFrac: 0.19, wFrac: 0.06,  h: 42 },
  { xFrac: 0.24, wFrac: 0.04,  h: 72 },
  { xFrac: 0.27, wFrac: 0.055, h: 88 },
  { xFrac: 0.32, wFrac: 0.035, h: 60 },
  { xFrac: 0.35, wFrac: 0.065, h: 96 }, // cluster near center-left
  { xFrac: 0.41, wFrac: 0.04,  h: 78 },
  { xFrac: 0.44, wFrac: 0.05,  h: 55 },
  { xFrac: 0.48, wFrac: 0.04,  h: 88 },
  { xFrac: 0.51, wFrac: 0.055, h: 100 }, // tallest — center
  { xFrac: 0.56, wFrac: 0.04,  h: 72 },
  { xFrac: 0.59, wFrac: 0.06,  h: 60 },
  { xFrac: 0.64, wFrac: 0.04,  h: 82 },
  { xFrac: 0.67, wFrac: 0.055, h: 48 },
  { xFrac: 0.72, wFrac: 0.04,  h: 70 },
  { xFrac: 0.75, wFrac: 0.06,  h: 86 },
  { xFrac: 0.80, wFrac: 0.035, h: 52 },
  { xFrac: 0.83, wFrac: 0.055, h: 66 },
  { xFrac: 0.88, wFrac: 0.04,  h: 44 },
  { xFrac: 0.91, wFrac: 0.05,  h: 58 },
  { xFrac: 0.95, wFrac: 0.05,  h: 40 },
];
const SKYLINE_MAX_H = 104; // headroom above horizon for clip container

function CitySkyline() {
  const HORIZON_Y = H * 0.48;
  return (
    <View
      style={{
        position: 'absolute',
        top: HORIZON_Y - SKYLINE_MAX_H,
        left: 0,
        width: W,
        height: SKYLINE_MAX_H,
        overflow: 'hidden',
      }}
      pointerEvents="none"
    >
      {SKYLINE_BUILDINGS.map((b, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: b.xFrac * W,
            bottom: 0,
            width: b.wFrac * W,
            height: b.h,
            backgroundColor: '#07001A',
            borderTopWidth: 1,
            borderTopColor: i % 3 === 0 ? RETRO_COLORS.neonPurple : RETRO_COLORS.neonMagenta,
            opacity: 0.92,
          }}
        >
          {/* A couple of tiny window lights per building */}
          {b.h > 55 && (
            <View style={{ position: 'absolute', top: 8, left: '20%', width: 2, height: 2, backgroundColor: RETRO_COLORS.neonCyan, opacity: 0.7 }} />
          )}
          {b.h > 70 && (
            <View style={{ position: 'absolute', top: 18, right: '20%', width: 2, height: 2, backgroundColor: RETRO_COLORS.neonPink, opacity: 0.6 }} />
          )}
        </View>
      ))}
    </View>
  );
}

// ─── Palm tree silhouette ─────────────────────────────────────────────────────
function PalmTree({ x, scale = 1, flip = false }: { x: number; scale?: number; flip?: boolean }) {
  const trunk = { width: 10 * scale, height: 80 * scale };
  const frondColor = RETRO_COLORS.palmFrond;
  const trunkColor = RETRO_COLORS.palmTrunk;

  return (
    <View
      style={{
        position: 'absolute',
        bottom: H * 0.18, // sit just above the grid floor
        left: x,
        transform: [{ scaleX: flip ? -1 : 1 }],
        alignItems: 'center',
      }}
    >
      {/* Trunk */}
      <View style={[{ width: trunk.width, height: trunk.height, backgroundColor: trunkColor, borderRadius: trunk.width / 2 }, { transform: [{ rotate: '-5deg' }] }]} />
      {/* Fronds — fanned ellipses */}
      {[
        { rotate: '-80deg', tx: -18 * scale, ty: -trunk.height - 4 * scale },
        { rotate: '-50deg', tx: -14 * scale, ty: -trunk.height - 8 * scale },
        { rotate: '-20deg', tx: -6 * scale, ty: -trunk.height - 10 * scale },
        { rotate: '10deg',  tx: 4 * scale,  ty: -trunk.height - 10 * scale },
        { rotate: '40deg',  tx: 12 * scale, ty: -trunk.height - 8 * scale },
        { rotate: '70deg',  tx: 18 * scale, ty: -trunk.height - 4 * scale },
      ].map((f, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: 36 * scale,
            height: 10 * scale,
            borderRadius: 5 * scale,
            backgroundColor: frondColor,
            top: 0,
            left: trunk.width / 2 - 18 * scale,
            transform: [
              { translateX: f.tx },
              { translateY: f.ty },
              { rotate: f.rotate },
            ],
          }}
        />
      ))}
    </View>
  );
}

// ─── Perspective grid floor ───────────────────────────────────────────────────
function PerspectiveGrid() {
  const HORIZON_Y = H * 0.48;
  const FLOOR_H = H - HORIZON_Y;
  const VANISH_X = W / 2;

  // Horizontal lines — evenly spaced in screen space (perspective-compressed near horizon)
  const hLines = Array.from({ length: GRID_ROWS }, (_, i) => {
    const t = (i + 1) / GRID_ROWS;   // 0=horizon, 1=near edge
    const perspT = t * t;             // quadratic compression for perspective feel
    return H * 0.48 + perspT * FLOOR_H * 0.92;
  });

  // Vertical "convergence" lines fanning from vanishing point
  const vLines = Array.from({ length: GRID_COLS + 1 }, (_, i) => {
    const t = i / GRID_COLS - 0.5;   // -0.5 to 0.5
    return { farX: VANISH_X + t * 20, nearX: VANISH_X + t * W * 1.2 };
  });

  return (
    <View style={[StyleSheet.absoluteFill, { top: HORIZON_Y, overflow: 'hidden' }]}>
      {/* Floor base */}
      <View style={{ flex: 1, backgroundColor: RETRO_COLORS.gridFloor }} />

      {/* Horizontal grid lines (scrolling offset from animation) */}
      {hLines.map((y, i) => (
        <Animated.View
          key={`h-${i}`}
          style={{
            position: 'absolute',
            top: y - HORIZON_Y,
            left: 0,
            right: 0,
            height: i % 2 === 0 ? 1.5 : 1,
            backgroundColor: i % 2 === 0 ? RETRO_COLORS.gridLine : RETRO_COLORS.gridLineAlt,
            opacity: 0.5 + (i / GRID_ROWS) * 0.5,
          }}
        />
      ))}

      {/* Vertical convergence lines */}
      {vLines.map((vl, i) => {
        const dx = vl.nearX - vl.farX;
        const dy = FLOOR_H;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dx, dy) * (180 / Math.PI);
        return (
          <View
            key={`v-${i}`}
            style={{
              position: 'absolute',
              top: 0,
              left: vl.farX - 1,
              width: 1.5,
              height: len,
              backgroundColor: i % 2 === 0 ? RETRO_COLORS.gridLine : RETRO_COLORS.gridLineAlt,
              opacity: 0.55,
              // Rotate around top-center using translate sequence instead of
              // transformOrigin (partial Android support in RN 0.82+).
              transform: [
                { translateY: -(len / 2) },
                { rotate: `${angle}deg` },
                { translateY: len / 2 },
              ],
            }}
          />
        );
      })}
    </View>
  );
}

// ─── Scanline overlay ─────────────────────────────────────────────────────────
function ScanlineOverlay() {
  const lines = Array.from({ length: Math.ceil(H / 4) }, (_, i) => i);
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {lines.map(i => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: i * 4,
            left: 0, right: 0,
            height: 1,
            backgroundColor: 'rgba(0,0,0,0.08)',
          }}
        />
      ))}
    </View>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function SynthwaveBackground({
  children,
  sunUpperLeft = false,
}: {
  children?: React.ReactNode;
  sunUpperLeft?: boolean;
}) {

  return (
    <View style={styles.root}>
      {/* Sky layers (dark violet → purple) */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: RETRO_COLORS.skyTop }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: RETRO_COLORS.skyMid, top: '20%', opacity: 0.6 }]} />
      {/* Horizon glow strip */}
      <View
        style={{
          position: 'absolute',
          left: 0, right: 0,
          top: H * 0.44,
          height: 32,
          backgroundColor: RETRO_COLORS.horizonGlow,
          opacity: 0.28,
        }}
      />

      {/* Stars */}
      {STARS.map((s, i) => (
        <Star key={i} {...s} />
      ))}

      {/* Sun */}
      <SynthwaveSun upperLeft={sunUpperLeft} />

      {/* Grid floor */}
      <PerspectiveGrid />

      {/* City skyline — sits at the horizon between grid floor and palms */}
      <CitySkyline />

      {/* Palm silhouettes */}
      <PalmTree x={-10} scale={1.0} />
      <PalmTree x={W - 90} scale={0.9} flip />
      <PalmTree x={W * 0.08} scale={0.65} />
      <PalmTree x={W - 60} scale={0.6} flip />

      {/* Scanlines */}
      <ScanlineOverlay />

      {/* Content on top */}
      <View style={[StyleSheet.absoluteFill, { zIndex: 10 }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: RETRO_COLORS.skyTop,
  },
});

export default SynthwaveBackground;
