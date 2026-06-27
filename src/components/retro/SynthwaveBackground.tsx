/**
 * SynthwaveBackground
 *
 * Animated retro Outrun / synthwave scene rendered entirely with React Native
 * Views and the built-in Animated API — no images, no SVG, no gradient library.
 *
 * Layer order (bottom → top):
 *   1. Gradient sky (near-black → deep purple → warm orange/pink at horizon)
 *   2. Twinkling stars (randomly placed dots, opacity Animated loop)
 *   3. Glowing sunset sun (circle with layered glow halos + scanline bands)
 *   4. Neon city skyline silhouette (buildings with lit windows)
 *   5. Scrolling perspective grid floor (horizontal lines animated toward viewer)
 *   6. Purple/magenta palm silhouettes
 *   7. Subtle scanline overlay
 *   8. Content (children)
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { RETRO_COLORS, RETRO_TIMING } from '../../theme/retro';

// Pure-JS gradient — renders 28 thin strips interpolated between color stops.
// Replaces expo-linear-gradient so the app runs in Expo Go without a native build.
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lerp(a: number, b: number, t: number) { return Math.round(a + (b - a) * t); }

interface JsGradientProps {
  colors: string[];
  locations: number[];
  style?: object;
}
function JsGradient({ colors, locations, style }: JsGradientProps) {
  const STEPS = 28;
  const rgbs = colors.map(hexToRgb);
  const strips = Array.from({ length: STEPS }, (_, i) => {
    const t = i / STEPS;
    let seg = locations.findIndex(l => l > t) - 1;
    if (seg < 0) seg = 0;
    if (seg >= colors.length - 1) seg = colors.length - 2;
    const segT = (t - locations[seg]) / (locations[seg + 1] - locations[seg]);
    const [ar, ag, ab] = rgbs[seg];
    const [br, bg, bb] = rgbs[seg + 1];
    const c = `rgb(${lerp(ar,br,segT)},${lerp(ag,bg,segT)},${lerp(ab,bb,segT)})`;
    return <View key={i} style={{ flex: 1, backgroundColor: c }} />;
  });
  return <View style={[style, { flexDirection: 'column' }]}>{strips}</View>;
}

const { width: W, height: H } = Dimensions.get('window');

const HORIZON_Y = H * 0.48;
const FLOOR_H = H - HORIZON_Y;
const GRID_ROWS = 14;
const GRID_COLS = 9;

// ─── Star positions (deterministic, stable across renders) ────────────────────
const STARS: { x: number; y: number; size: number; delay: number; color: string }[] = Array.from(
  { length: 80 },
  (_, i) => {
    const colorIdx = i % 7;
    const color =
      colorIdx === 0 ? 'rgba(0,255,255,0.9)' :    // cyan
      colorIdx === 1 ? 'rgba(255,0,255,0.8)' :    // magenta
      colorIdx === 2 ? 'rgba(255,255,255,0.95)' : // white
      colorIdx === 3 ? 'rgba(200,150,255,0.85)' : // lavender
      colorIdx === 4 ? 'rgba(255,255,255,0.9)' :
      colorIdx === 5 ? 'rgba(255,220,100,0.7)' :  // gold
                       'rgba(255,255,255,0.8)';
    return {
      x: ((i * 127 + 37) % 97) / 97,
      y: ((i * 83 + 19) % 89) / 89,
      size: i % 5 === 0 ? 3 : i % 3 === 0 ? 2.5 : i % 2 === 0 ? 2 : 1.5,
      delay: (i * 233) % RETRO_TIMING.starTwinkle,
      color,
    };
  }
);

// ─── City skyline buildings ───────────────────────────────────────────────────
// Placed between the horizon and the sun area, left and right of center
const BUILDINGS: {
  x: number; w: number; h: number;
  windows: { col: number; row: number; color: string }[];
}[] = [
  // Left skyline cluster
  { x: 0,   w: 32, h: 68, windows: [{col:0,row:0,'color':'rgba(0,255,255,0.9)'},{col:1,row:1,'color':'rgba(255,0,255,0.8)'},{col:0,row:2,'color':'rgba(255,200,0,0.7)'}] },
  { x: 30,  w: 22, h: 44, windows: [{col:0,row:0,'color':'rgba(0,255,255,0.85)'},{col:1,row:0,'color':'rgba(255,0,255,0.7)'}] },
  { x: 50,  w: 18, h: 82, windows: [{col:0,row:0,'color':'rgba(255,0,255,0.9)'},{col:0,row:1,'color':'rgba(0,255,255,0.8)'},{col:0,row:2,'color':'rgba(255,200,0,0.75)'},{col:0,row:3,'color':'rgba(0,255,255,0.6)'}] },
  { x: 66,  w: 28, h: 55, windows: [{col:0,row:0,'color':'rgba(0,255,255,0.8)'},{col:1,row:1,'color':'rgba(255,0,255,0.9)'},{col:0,row:2,'color':'rgba(255,200,0,0.6)'}] },
  { x: 92,  w: 20, h: 40, windows: [{col:0,row:0,'color':'rgba(255,0,255,0.85)'}] },
  { x: 110, w: 14, h: 62, windows: [{col:0,row:0,'color':'rgba(0,255,255,0.9)'},{col:0,row:1,'color':'rgba(255,200,0,0.7)'}] },
  // Right skyline cluster
  { x: W - 30,  w: 30, h: 72, windows: [{col:0,row:0,'color':'rgba(255,0,255,0.9)'},{col:1,row:1,'color':'rgba(0,255,255,0.85)'},{col:0,row:2,'color':'rgba(255,200,0,0.7)'}] },
  { x: W - 58,  w: 26, h: 48, windows: [{col:0,row:0,'color':'rgba(0,255,255,0.9)'},{col:1,row:0,'color':'rgba(255,0,255,0.8)'}] },
  { x: W - 80,  w: 20, h: 88, windows: [{col:0,row:0,'color':'rgba(255,0,255,0.9)'},{col:0,row:1,'color':'rgba(0,255,255,0.8)'},{col:0,row:2,'color':'rgba(255,200,0,0.75)'},{col:0,row:3,'color':'rgba(255,0,255,0.6)'}] },
  { x: W - 105, w: 24, h: 60, windows: [{col:0,row:0,'color':'rgba(0,255,255,0.8)'},{col:1,row:1,'color':'rgba(255,0,255,0.9)'}] },
  { x: W - 128, w: 22, h: 42, windows: [{col:0,row:0,'color':'rgba(255,200,0,0.85)'}] },
  { x: W - 148, w: 16, h: 66, windows: [{col:0,row:0,'color':'rgba(255,0,255,0.9)'},{col:0,row:1,'color':'rgba(0,255,255,0.8)'}] },
];

// ─── Star component ───────────────────────────────────────────────────────────
function Star({ x, y, size, delay, color }: { x: number; y: number; size: number; delay: number; color: string }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration: RETRO_TIMING.starTwinkle / 2, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.15, duration: RETRO_TIMING.starTwinkle / 2, useNativeDriver: true }),
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
        top: y * (HORIZON_Y * 0.85),
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
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
        Animated.timing(pulse, { toValue: 1.05, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.96, duration: 1800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const SUN_R = 76;
  const cx = upperLeft ? W * 0.20 : W / 2;
  const sunTop = upperLeft ? H * 0.10 : H * 0.26;

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
      {/* Layered glow halos — progressively tighter and brighter */}
      {[3.2, 2.7, 2.2, 1.85].map((scale, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: SUN_R * 2 * scale,
            height: SUN_R * 2 * scale,
            borderRadius: SUN_R * scale,
            backgroundColor:
              i === 0 ? 'rgba(128,32,255,0.10)' :
              i === 1 ? 'rgba(255,0,255,0.15)' :
              i === 2 ? 'rgba(255,16,136,0.22)' :
                        'rgba(255,107,53,0.28)',
          }}
        />
      ))}
      {/* Sun body */}
      <View
        style={{
          width: SUN_R * 2,
          height: SUN_R * 2,
          borderRadius: SUN_R,
          overflow: 'hidden',
          backgroundColor: RETRO_COLORS.sunTop,
        }}
      >
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: SUN_R, backgroundColor: RETRO_COLORS.sunMid }} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: SUN_R * 0.55, backgroundColor: RETRO_COLORS.sunBottom }} />
        {/* Horizontal scanlines across sun body */}
        {[0, 1, 2, 3, 4, 5].map(i => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: 0, right: 0,
              top: SUN_R + (i * (SUN_R / 6)) + 2,
              height: 3,
              backgroundColor: 'rgba(4,0,15,0.55)',
            }}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// ─── City skyline silhouette ──────────────────────────────────────────────────
function CitySkyline() {
  const SKYLINE_BASE = HORIZON_Y;

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} pointerEvents="none">
      {BUILDINGS.map((b, bi) => {
        const buildingTop = SKYLINE_BASE - b.h;
        return (
          <View
            key={`b-${bi}`}
            style={{
              position: 'absolute',
              left: b.x,
              top: buildingTop,
              width: b.w,
              height: b.h,
              backgroundColor: RETRO_COLORS.skylineBuilding,
            }}
          >
            {/* Lit windows */}
            {b.windows.map((win, wi) => {
              const winW = Math.max(4, b.w * 0.28);
              const winH = 5;
              const spacing = b.w / 3;
              const winX = win.col * spacing + 4;
              const winY = 8 + win.row * 16;
              return (
                <View
                  key={`w-${wi}`}
                  style={{
                    position: 'absolute',
                    left: winX,
                    top: winY,
                    width: winW,
                    height: winH,
                    backgroundColor: win.color,
                    borderRadius: 1,
                  }}
                />
              );
            })}
            {/* Rooftop antenna / detail on tall buildings */}
            {b.h > 65 && (
              <View
                style={{
                  position: 'absolute',
                  top: -8,
                  left: b.w / 2 - 1,
                  width: 2,
                  height: 10,
                  backgroundColor: RETRO_COLORS.neonMagenta,
                  opacity: 0.7,
                }}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

// ─── Perspective grid floor (NOW ANIMATED toward viewer) ─────────────────────
function PerspectiveGrid({ scrollAnim }: { scrollAnim: Animated.Value }) {
  const VANISH_X = W / 2;

  // Horizontal lines: perspT = t^2 puts many lines near horizon, few near viewer
  // Render GRID_ROWS + 2 extra rows so the loop is seamless
  const hLines = Array.from({ length: GRID_ROWS + 2 }, (_, i) => {
    const t = (i + 1) / GRID_ROWS;
    const perspT = t * t;
    return perspT * FLOOR_H * 0.96; // y relative to floor top
  });

  // Scroll offset: translate entire hLines Animated.View downward to simulate
  // the grid moving toward the viewer. Distance = one average row spacing.
  const scrollOffset = scrollAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FLOOR_H / GRID_ROWS],
  });

  // Vertical convergence lines fan from vanishing point
  const vLines = Array.from({ length: GRID_COLS + 1 }, (_, i) => {
    const t = i / GRID_COLS - 0.5;
    return { farX: VANISH_X + t * 24, nearX: VANISH_X + t * W * 1.25 };
  });

  return (
    <View style={{ position: 'absolute', top: HORIZON_Y, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {/* Floor base fill */}
      <View style={StyleSheet.absoluteFill}>
        <View style={{ flex: 1, backgroundColor: RETRO_COLORS.gridFloor }} />
      </View>

      {/* Animated horizontal lines — translate toward viewer */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          transform: [{ translateY: scrollOffset }],
        }}
      >
        {hLines.map((y, i) => {
          const opacityT = y / (FLOOR_H * 0.96);
          return (
            <View
              key={`h-${i}`}
              style={{
                position: 'absolute',
                top: y,
                left: 0, right: 0,
                height: i % 2 === 0 ? 1.5 : 1,
                backgroundColor: i % 2 === 0 ? RETRO_COLORS.gridLine : RETRO_COLORS.gridLineAlt,
                opacity: 0.25 + opacityT * 0.75,
              }}
            />
          );
        })}
      </Animated.View>

      {/* Static vertical convergence lines */}
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
              width: i === Math.floor(GRID_COLS / 2) ? 2 : 1.5,
              height: len,
              backgroundColor: i % 2 === 0 ? RETRO_COLORS.gridLine : RETRO_COLORS.gridLineAlt,
              opacity: i === Math.floor(GRID_COLS / 2) ? 0.8 : 0.5,
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}
    </View>
  );
}

// ─── Palm tree silhouette (purple/magenta tinted) ─────────────────────────────
function PalmTree({ x, scale = 1, flip = false }: { x: number; scale?: number; flip?: boolean }) {
  const trunk = { width: 10 * scale, height: 80 * scale };

  return (
    <View
      style={{
        position: 'absolute',
        bottom: H * 0.18,
        left: x,
        transform: [{ scaleX: flip ? -1 : 1 }],
        alignItems: 'center',
      }}
    >
      {/* Trunk — deep purple silhouette */}
      <View style={{
        width: trunk.width,
        height: trunk.height,
        backgroundColor: RETRO_COLORS.palmTrunk,
        borderRadius: trunk.width / 2,
        transform: [{ rotate: '-5deg' }],
      }} />
      {/* Fronds — purple/magenta tinted silhouettes */}
      {[
        { rotate: '-80deg', tx: -18 * scale, ty: -trunk.height - 4 * scale },
        { rotate: '-50deg', tx: -14 * scale, ty: -trunk.height - 8 * scale },
        { rotate: '-20deg', tx: -6 * scale,  ty: -trunk.height - 10 * scale },
        { rotate: '10deg',  tx: 4 * scale,   ty: -trunk.height - 10 * scale },
        { rotate: '40deg',  tx: 12 * scale,  ty: -trunk.height - 8 * scale },
        { rotate: '70deg',  tx: 18 * scale,  ty: -trunk.height - 4 * scale },
      ].map((f, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: 36 * scale,
            height: 10 * scale,
            borderRadius: 5 * scale,
            backgroundColor: RETRO_COLORS.palmFrond,
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
            backgroundColor: 'rgba(0,0,0,0.07)',
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
  const scrollAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(scrollAnim, {
        toValue: 1,
        duration: RETRO_TIMING.gridScroll,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [scrollAnim]);

  return (
    <View style={styles.root}>
      {/* Layer 1: Gradient sky — near-black space → deep purple → warm orange/pink at horizon */}
      <JsGradient
        colors={['#04000F', '#0A0030', '#200060', '#4A0080', '#900060', '#C83040', '#E06028']}
        locations={[0, 0.15, 0.30, 0.48, 0.65, 0.82, 1.0]}
        style={StyleSheet.absoluteFill}
      />

      {/* Horizon glow — vivid magenta strip */}
      <View
        style={{
          position: 'absolute',
          left: 0, right: 0,
          top: HORIZON_Y - 4,
          height: 40,
          backgroundColor: RETRO_COLORS.horizonGlow,
          opacity: 0.35,
        }}
      />
      {/* Secondary softer horizon glow */}
      <View
        style={{
          position: 'absolute',
          left: 0, right: 0,
          top: HORIZON_Y - 16,
          height: 64,
          backgroundColor: 'rgba(255,0,180,0.12)',
        }}
      />

      {/* Layer 2: Stars */}
      {STARS.map((s, i) => (
        <Star key={i} {...s} />
      ))}

      {/* Layer 3: Sun */}
      <SynthwaveSun upperLeft={sunUpperLeft} />

      {/* Layer 4: Neon city skyline */}
      <CitySkyline />

      {/* Layer 5: Perspective grid floor (animated) */}
      <PerspectiveGrid scrollAnim={scrollAnim} />

      {/* Layer 6: Palm silhouettes (purple-tinted) */}
      <PalmTree x={-10} scale={1.0} />
      <PalmTree x={W - 90} scale={0.9} flip />
      <PalmTree x={W * 0.08} scale={0.65} />
      <PalmTree x={W - 60} scale={0.6} flip />

      {/* Layer 7: Scanlines */}
      <ScanlineOverlay />

      {/* Layer 8: Content */}
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
