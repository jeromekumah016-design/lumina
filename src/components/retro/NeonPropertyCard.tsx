/**
 * NeonPropertyCard
 *
 * A drop-in replacement for the inline property card in PropertySelectionScreen.
 * Accepts the SAME props (Property + vote/favorite/comment handlers) and renders
 * the neon synthwave-styled version:
 *   - Neon magenta border with glow shadow
 *   - Price badge top-left (neon yellow on dark)
 *   - Heart favorite top-right (neon pink when active)
 *   - Image with neon frame (graceful fallback placeholder if imageUrl is absent)
 *   - Property name + location in neon white / lavender
 *   - KEEP (cyan) / ELIMINATE (magenta) action buttons
 *   - Vote count + comment count footer
 *   - ELIMINATED overlay if applicable
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Property } from '../../types/property';
import { RETRO_COLORS, RETRO_GLOW, RETRO_BORDERS, RETRO_SIZE, RETRO_FONT, RETRO_TIMING } from '../../theme/retro';

export interface NeonPropertyCardProps {
  property: Property;
  isEliminated?: boolean;
  showResultsOverlay?: boolean;
  isOverBudget?: boolean;
  isTopPick?: boolean;
  onVote: (id: string, vote: 'keep' | 'eliminate' | null) => void;
  onFavorite: (id: string) => void;
  onOpenComments: (property: Property) => void;
  onReport?: (property: Property) => void;
  heartAnimStyle?: object;
  /** Compact 2-column mode — smaller image, cyan title, pink location, mockup-style footer */
  compact?: boolean;
}

// ─── Synthwave gradient placeholder (no imageUrl) ─────────────────────────────
function ImagePlaceholder() {
  return (
    <View style={styles.imagePlaceholder}>
      {/* Layered colored bands simulating a synthwave sunset */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: RETRO_COLORS.skyTop }]} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', backgroundColor: '#0D0035' }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', backgroundColor: RETRO_COLORS.sunBottom, opacity: 0.6 }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '15%', backgroundColor: RETRO_COLORS.gridFloor }} />
      {/* Mini sun circle */}
      <View style={styles.placeholderSun}>
        <View style={[styles.placeholderSunInner, { backgroundColor: RETRO_COLORS.sunTop }]} />
        <View style={[StyleSheet.absoluteFill, { top: '50%', backgroundColor: RETRO_COLORS.sunMid, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 }]} />
      </View>
      {/* Mini grid lines */}
      {[0, 1, 2].map(i => (
        <View
          key={i}
          style={{
            position: 'absolute',
            bottom: 10 + i * 14,
            left: 0, right: 0,
            height: 1,
            backgroundColor: RETRO_COLORS.gridLine,
            opacity: 0.5,
          }}
        />
      ))}
      <Text style={styles.placeholderText}>NO IMAGE</Text>
    </View>
  );
}

// ─── NeonPropertyCard ─────────────────────────────────────────────────────────
export function NeonPropertyCard({
  property: p,
  isEliminated = false,
  showResultsOverlay = false,
  isOverBudget = false,
  isTopPick = false,
  onVote,
  onFavorite,
  onOpenComments,
  onReport,
  heartAnimStyle,
  compact = false,
}: NeonPropertyCardProps) {
  const borderPulse = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(borderPulse, { toValue: 1, duration: 1400, useNativeDriver: false }),
        Animated.timing(borderPulse, { toValue: 0.55, duration: 1400, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [borderPulse]);

  const keepActive = p.myVote === 'keep';
  const elimActive = p.myVote === 'eliminate';

  return (
    <Pressable
      onPress={() => onOpenComments(p)}
      style={[styles.card, compact && styles.cardCompact, isEliminated && styles.cardEliminated]}
    >
      {/* Neon glow border (animated opacity) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.glowBorder,
          { opacity: borderPulse },
        ]}
        pointerEvents="none"
      />

      {/* ── Image area ── */}
      <View style={[styles.imageContainer, compact && { height: 110 }]}>
        {p.imageUrl ? (
          <Image source={{ uri: p.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <ImagePlaceholder />
        )}

        {/* Neon cyan image frame overlay */}
        <View style={styles.imageNeonFrame} pointerEvents="none" />

        {/* Price badge — top left */}
        <View style={styles.priceBadge}>
          {compact ? (
            <Text style={styles.priceBadgeText}>
              ${p.pricePerPerson}
              <Text style={styles.priceBadgeSub}>{'\n'}/ PER PERSON</Text>
            </Text>
          ) : (
            <Text style={styles.priceBadgeText}>${p.pricePerPerson}<Text style={styles.priceBadgeSub}>/pp</Text></Text>
          )}
        </View>

        {/* Heart — top right */}
        <Pressable
          onPress={() => onFavorite(p.id)}
          style={styles.heartButton}
          hitSlop={8}
        >
          {heartAnimStyle ? (
            <Animated.View style={heartAnimStyle}>
              <Ionicons
                name={p.isFavorited ? 'heart' : 'heart-outline'}
                size={18}
                color={p.isFavorited ? RETRO_COLORS.neonPink : RETRO_COLORS.textMuted}
              />
            </Animated.View>
          ) : (
            <Ionicons
              name={p.isFavorited ? 'heart' : 'heart-outline'}
              size={18}
              color={p.isFavorited ? RETRO_COLORS.neonPink : RETRO_COLORS.textMuted}
            />
          )}
        </Pressable>

        {/* ELIMINATED overlay */}
        {showResultsOverlay && isEliminated && (
          <View style={styles.eliminatedOverlay}>
            <View style={styles.eliminatedBadge}>
              <Text style={styles.eliminatedText}>ELIMINATED</Text>
            </View>
          </View>
        )}

        {/* Top pick badge */}
        {isTopPick && (
          <View style={styles.topPickBadge}>
            <Text style={styles.topPickText}>★ TOP PICK</Text>
          </View>
        )}
      </View>

      {/* ── Card body ── */}
      <View style={[styles.body, compact && { padding: 8 }]}>
        <Text
          style={[styles.title, compact && { color: RETRO_COLORS.neonCyan, fontSize: 11, letterSpacing: 0.5 }]}
          numberOfLines={1}
        >
          {compact ? p.title.toUpperCase() : p.title}
        </Text>
        <Text style={[styles.location, compact && { color: RETRO_COLORS.neonPink, fontSize: 9 }]}>
          {p.location.city}, {p.location.country}
        </Text>

        {isOverBudget && (
          <Text style={styles.budgetWarning}>⚠ OVER BUDGET</Text>
        )}

        {/* Divider line */}
        <View style={[styles.divider, compact && { marginVertical: 5 }]} />

        {/* KEEP / ELIMINATE buttons */}
        <View style={styles.buttonRow}>
          <Pressable
            onPress={() => onVote(p.id, keepActive ? null : 'keep')}
            style={[styles.actionBtn, styles.keepBtn, keepActive && styles.keepBtnActive, compact && { paddingVertical: 5 }]}
          >
            <Text style={[styles.actionBtnText, styles.keepText, keepActive && styles.keepTextActive, compact && { fontSize: 9 }]}>
              {compact ? 'KEEP' : `KEEP · ${p.keepVotes}`}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onVote(p.id, elimActive ? null : 'eliminate')}
            style={[styles.actionBtn, styles.elimBtn, elimActive && styles.elimBtnActive, compact && { paddingVertical: 5 }]}
          >
            <Text style={[styles.actionBtnText, styles.elimText, elimActive && styles.elimTextActive, compact && { fontSize: 9 }]}>
              {compact ? 'ELIMINATE' : `ELIMINATE · ${p.eliminateVotes}`}
            </Text>
          </Pressable>
        </View>

        {/* Footer: vote count (compact) or comment count + report (full) */}
        {compact ? (
          <View style={styles.footer}>
            <Ionicons name="person-outline" size={11} color={RETRO_COLORS.neonPink} />
            <Text style={{ color: RETRO_COLORS.neonPink, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>
              {p.keepVotes} VOTES
            </Text>
            <Pressable onPress={() => onOpenComments(p)} style={[styles.commentBtn, { marginLeft: 'auto' }]}>
              <Ionicons name="chatbubble-outline" size={11} color={RETRO_COLORS.neonPink} />
              <Text style={[styles.commentCount, { fontSize: 9, color: RETRO_COLORS.neonPink }]}>{p.commentCount}</Text>
            </Pressable>
            {p.myVote && (
              <View style={[styles.voteDot, { backgroundColor: p.myVote === 'keep' ? RETRO_COLORS.neonCyan : RETRO_COLORS.neonMagenta }]} />
            )}
          </View>
        ) : (
          <View style={styles.footer}>
            <Pressable onPress={() => onOpenComments(p)} style={styles.commentBtn}>
              <Ionicons name="chatbubble-outline" size={13} color={RETRO_COLORS.neonCyan} />
              <Text style={styles.commentCount}>{p.commentCount}</Text>
            </Pressable>
            {onReport && (
              <Pressable onPress={() => onReport(p)} hitSlop={6}>
                <Ionicons name="flag-outline" size={13} color={RETRO_COLORS.textMuted} />
              </Pressable>
            )}
            {p.myVote && (
              <View style={[styles.voteDot, { backgroundColor: p.myVote === 'keep' ? RETRO_COLORS.neonCyan : RETRO_COLORS.neonMagenta }]} />
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
    borderRadius: RETRO_SIZE.cardBorderRadius,
    backgroundColor: RETRO_COLORS.cardBg,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: RETRO_COLORS.neonMagenta,
    ...RETRO_GLOW.pink,
  },
  cardCompact: {
    marginBottom: 8,
  },
  cardEliminated: {
    opacity: 0.45,
  },
  glowBorder: {
    borderRadius: RETRO_SIZE.cardBorderRadius,
    borderWidth: 2,
    borderColor: RETRO_COLORS.neonCyan,
    zIndex: 5,
    ...RETRO_GLOW.cyan,
  },

  // Image
  imageContainer: {
    width: '100%',
    height: RETRO_SIZE.cardImageHeight,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageNeonFrame: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 2,
    borderColor: RETRO_COLORS.neonCyan,
    opacity: 0.4,
  },

  // Price badge — lit neon sign style
  priceBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(4,0,15,0.92)',
    borderWidth: 2,
    borderColor: RETRO_COLORS.neonYellow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RETRO_SIZE.badgeBorderRadius,
    ...RETRO_GLOW.yellow,
  },
  priceBadgeText: {
    color: RETRO_COLORS.neonYellow,
    fontWeight: '900',
    fontSize: RETRO_FONT.labelSize + 1,
    letterSpacing: 0.5,
    textShadowColor: RETRO_COLORS.neonYellow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  priceBadgeSub: {
    fontSize: 9,
    color: RETRO_COLORS.textSecondary,
    fontWeight: '400',
  },

  // Heart
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(4,0,15,0.92)',
    borderWidth: 2,
    borderColor: RETRO_COLORS.neonPink,
    padding: 6,
    borderRadius: 999,
    ...RETRO_GLOW.pink,
  },

  // Eliminated overlay
  eliminatedOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eliminatedBadge: {
    borderWidth: 2,
    borderColor: RETRO_COLORS.neonMagenta,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(10,0,32,0.9)',
    ...RETRO_GLOW.magenta,
  },
  eliminatedText: {
    color: RETRO_COLORS.neonMagenta,
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: RETRO_FONT.letterSpacing,
  },

  // Top pick badge
  topPickBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(10,0,32,0.88)',
    borderWidth: 1,
    borderColor: RETRO_COLORS.neonYellow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  topPickText: {
    color: RETRO_COLORS.neonYellow,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Image placeholder
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  placeholderSun: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    position: 'absolute',
    top: '18%',
  },
  placeholderSunInner: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 36,
  },
  placeholderText: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    color: RETRO_COLORS.neonMagenta,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    opacity: 0.7,
  },

  // Card body
  body: {
    padding: RETRO_SIZE.cardPadding,
  },
  title: {
    color: RETRO_COLORS.textPrimary,
    fontSize: RETRO_FONT.cardTitleSize,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  location: {
    color: RETRO_COLORS.textSecondary,
    fontSize: RETRO_FONT.microSize + 1,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  budgetWarning: {
    color: RETRO_COLORS.neonOrange,
    fontSize: RETRO_FONT.microSize,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: RETRO_COLORS.neonMagenta,
    opacity: 0.3,
    marginVertical: 8,
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: RETRO_SIZE.buttonBorderRadius,
    borderWidth: 1.5,
    gap: 5,
  },
  actionBtnText: {
    fontSize: RETRO_FONT.microSize + 1,
    fontWeight: '700',
    letterSpacing: 1,
  },
  keepBtn: {
    backgroundColor: RETRO_COLORS.keepBg,
    borderColor: RETRO_COLORS.keepBorder,
  },
  keepBtnActive: {
    backgroundColor: RETRO_COLORS.neonCyan,
    borderColor: RETRO_COLORS.neonCyan,
    ...RETRO_GLOW.cyan,
  },
  keepText: {
    color: RETRO_COLORS.keepText,
  },
  keepTextActive: {
    color: '#000020',
  },
  elimBtn: {
    backgroundColor: RETRO_COLORS.elimBg,
    borderColor: RETRO_COLORS.elimBorder,
  },
  elimBtnActive: {
    backgroundColor: RETRO_COLORS.neonMagenta,
    borderColor: RETRO_COLORS.neonMagenta,
    ...RETRO_GLOW.magenta,
  },
  elimText: {
    color: RETRO_COLORS.elimText,
  },
  elimTextActive: {
    color: '#FFFFFF',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentCount: {
    color: RETRO_COLORS.neonCyan,
    fontSize: RETRO_FONT.microSize + 1,
    fontWeight: '600',
  },
  voteDot: {
    marginLeft: 'auto',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default NeonPropertyCard;
