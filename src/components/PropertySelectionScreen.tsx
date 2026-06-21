import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { propertyService } from '../services/propertyService';
import { Property, Round, Member, Comment } from '../types/property';
import { useLuminaState } from '../context/LuminaContext';
import { trustService } from '../services/trustService';
import { tripService } from '../services/tripService';
import { GroupVotingStatus, RankedProperty } from '../services/propertyService';
import { RETRO_THEME_ENABLED, RETRO_COLORS, RETRO_GLOW, RETRO_FONT, RETRO_SIZE } from '../theme/retro';
import { SynthwaveBackground } from './retro/SynthwaveBackground';
import { NeonPropertyCard } from './retro/NeonPropertyCard';
import { formatMockupCountdown } from '../utils/countdown';

/**
 * PropertySelectionScreen = the core "game view" for collaborative property voting in a travel cycle.
 * Polished to match UI reference mockups (assets/ui-refs/ref1.jpg + ref2.jpg) + new features.
 * Key elements: Lumina + gold star + tagline, overlapping avatars +N, light-blue game status banner w/ controller icon,
 * "Voting ends in" + HH:MM:SS + HRS/MIN/SEC, 2-votes notice + "X/2" budget + "How it works", destination header w/ "View map",
 * city selector chips (for cities-first demo), price badges on photos, hearts (animated), Keep/Elim thumbs buttons (limit aware),
 * votes + Comments footers, premium clean 2-col cards, myVote accent bar.
 *
 * New: 2-vote limit enforcement + UI, per-property animated comment modal (wired from card press), Results mode with
 * vote-sorted standings, elimination logic (top 3 shortlist, bottom marked ELIMINATED), "Finalize round" that advances Day + summary.
 * Reanimated animations: heart pop, modal slide/fade, grid fade on mode/city change.
 *
 * Preserved: Chicago/NYC/Atlanta/Miami fully supported with 6 properties, 6 titled homes/city, 10-person group (5W+5M), live countdown, per-city votes/favs/comments via AsyncStorage.
 * See refs for visual targets; "Tuscany" style in refs adapted to our city-based trips.
 */

export default function PropertySelectionScreen() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [round, setRound] = useState<Round | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentCity, setCurrentCity] = useState<string>('Chicago');
  const [timeLeft, setTimeLeft] = useState('23:47:12');

  // Derived for the header avatar cluster (photo-exact layout).
  // Always show up to 3 overlapping avatars + blue pill with +N for the rest.
  // With the initial 5 women + 5 men (10 total) this yields +7.
  const displayedAvatars = members.slice(0, 3);
  const extraCount = Math.max(0, members.length - 3);

  // Already in HH:MM:SS format for the reference banner style (e.g. 05:37:42)
  const displayCountdown = timeLeft;

  // --- New state for results/elimination, comments modal, vote budget, animations ---
  const [viewMode, setViewMode] = useState<'vote' | 'results'>('vote');
  const [eliminatedIds, setEliminatedIds] = useState<Set<string>>(new Set());
  const [userVoteCount, setUserVoteCount] = useState(0);
  const [resultsSummary, setResultsSummary] = useState<string | null>(null);

  // Per-property comment modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProp, setSelectedProp] = useState<Property | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  // Feature 1: live group-voting presence
  const [groupVotingStatus, setGroupVotingStatus] = useState<GroupVotingStatus | null>(null);

  // Feature 2: budget guardrails + ranked properties
  const [groupBudget, setGroupBudget] = useState<number>(130);
  const [rankedProperties, setRankedProperties] = useState<RankedProperty[]>([]);

  // Feature 3: conduct gate + safety report
  const [conductAccepted, setConductAccepted] = useState(true);
  const [reportingProp, setReportingProp] = useState<Property | null>(null);

  // Animation shared values (reanimated)
  const modalTranslate = useSharedValue(400);
  const modalOpacity = useSharedValue(0);
  const heartScale = useSharedValue(1);

  const heartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const gridOpacity = useSharedValue(1);
  const gridAnimStyle = useAnimatedStyle(() => ({ opacity: gridOpacity.value }));

  // Shared journey state for gating and contextual UI
  const { onboarded, membership, matching, isFullyReady, isMatched, currentTripCity } = useLuminaState();

  useEffect(() => {
    const loadData = async () => {
      const [city, props, r, mems] = await Promise.all([
        propertyService.getCurrentCity(),
        propertyService.getProperties(),
        propertyService.getCurrentRound(),
        propertyService.getMembers(),
      ]);
      // Retro theme defaults to the Coastal Demo dataset; classic uses trip city or service default
      const effectiveCity = RETRO_THEME_ENABLED
        ? 'Coastal Demo'
        : (isMatched && currentTripCity) ? currentTripCity : city;
      setCurrentCity(effectiveCity);
      if (effectiveCity !== city) {
        await propertyService.setCurrentCity(effectiveCity);
      }
      const finalProps = effectiveCity !== city ? await propertyService.getProperties() : props;
      setProperties(finalProps);
      setRound(r);
      setMembers(mems);
      setViewMode('vote');
      setEliminatedIds(new Set());
      setResultsSummary(null);
      await refreshVoteCount();
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live countdown
  useEffect(() => {
    if (!round) return;

    const interval = setInterval(() => {
      const deadline = new Date(round.deadline).getTime();
      const now = new Date().getTime();
      const distance = deadline - now;

      if (distance <= 0) {
        setTimeLeft('00:00:00');
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [round]);

  // Keep vote budget in sync after loads or votes
  const refreshVoteCount = useCallback(async () => {
    const count = await propertyService.getUserVoteCount();
    setUserVoteCount(count);
  }, []);

  useEffect(() => {
    refreshVoteCount();
  }, [properties, refreshVoteCount]);

  // Feature 1: poll live group-voting status every 8 s
  useEffect(() => {
    let active = true;
    propertyService.getGroupVotingStatus().then(s => { if (active) setGroupVotingStatus(s); });
    const iv = setInterval(() => {
      propertyService.simulateVoteProgress().then(s => { if (active) setGroupVotingStatus(s); });
    }, 8000);
    return () => { active = false; clearInterval(iv); };
  }, []);

  // Feature 2: rank properties whenever list or budget changes
  useEffect(() => {
    if (properties.length > 0) {
      setRankedProperties(propertyService.rankProperties(properties, groupBudget));
    }
  }, [properties, groupBudget]);

  // Feature 3: check conduct gate on mount
  useEffect(() => {
    trustService.isConductAccepted().then(ok => {
      if (!ok) setConductAccepted(false);
    });
  }, []);

  // Modal enter/exit animations (reanimated)
  useEffect(() => {
    if (modalVisible) {
      modalTranslate.value = withTiming(0, { duration: 280 });
      modalOpacity.value = withTiming(1, { duration: 220 });
    } else {
      modalTranslate.value = withTiming(400, { duration: 200 });
      modalOpacity.value = withTiming(0, { duration: 180 });
    }
  }, [modalVisible, modalTranslate, modalOpacity]);

  // Subtle grid transition animation when switching vote <-> results or city
  useEffect(() => {
    gridOpacity.value = withTiming(0.55, { duration: 60 });
    const t = setTimeout(() => {
      gridOpacity.value = withTiming(1, { duration: 180 });
    }, 70);
    return () => clearTimeout(t);
  }, [viewMode, currentCity, gridOpacity]);

  const handleVote = async (id: string, vote: 'keep' | 'eliminate' | null) => {
    const prop = properties.find((p) => p.id === id);
    if (!prop) return;

    // UI-side guard for the 2-vote limit (service also enforces)
    const isNewVote = prop.myVote == null && vote != null;
    if (isNewVote && userVoteCount >= 2) {
      Alert.alert(
        'Vote limit reached',
        'You have used your 2 votes. Clear or change a vote on a property you already selected to free a slot.',
        [{ text: 'OK' }]
      );
      return;
    }

    const updated = await propertyService.castVote(id, vote);
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? updated : p))
    );
    // count will refresh via effect
  };

  const handleToggleFavorite = async (id: string) => {
    // Heart pop animation (reanimated)
    heartScale.value = withSpring(1.4, { damping: 5, stiffness: 220 });
    setTimeout(() => {
      heartScale.value = withSpring(1, { damping: 8 });
    }, 160);

    const updated = await propertyService.toggleFavorite(id);
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? updated : p))
    );
    refreshVoteCount();
  };

  const openComments = async (prop: Property) => {
    setSelectedProp(prop);
    const loaded = await propertyService.getComments(prop.id);
    setComments(loaded);
    setNewCommentText('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    // slight delay so animation can finish before clearing
    setTimeout(() => {
      setSelectedProp(null);
      setComments([]);
    }, 200);
  };

  const submitComment = async () => {
    if (!selectedProp || !newCommentText.trim()) return;
    const created = await propertyService.addComment(selectedProp.id, newCommentText.trim());
    setComments((prev) => [...prev, created]);
    setNewCommentText('');
    // bump count in list
    setProperties((prev) => prev.map(p => p.id === selectedProp.id ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p));
  };

  const handleAdvanceRound = async () => {
    const r = await propertyService.advanceRound();
    setRound(r);
    // reset UI state for new round
    setViewMode('vote');
    setEliminatedIds(new Set());
    setResultsSummary(null);
    // reload props for fresh votes etc
    const fresh = await propertyService.getProperties();
    setProperties(fresh);
    setTimeLeft('18:30:00'); // approx for new
  };

  // Compute results on demand (top keep, bottom elim)
  const computeResults = () => {
    const sortedByKeep = [...properties].sort((a, b) => b.keepVotes - a.keepVotes);
    const bottom = [...properties].sort((a, b) => b.eliminateVotes - a.eliminateVotes).slice(0, 3).map(p => p.id);
    const summary = `Top picks: ${sortedByKeep.slice(0,3).map(p=>p.title).join(', ')}. Bottom elims: ${bottom.length} properties.`;
    setEliminatedIds(new Set(bottom));
    setResultsSummary(summary);
    setViewMode('results');
  };

  // Feature 3: safety report via Alert (no extra Modal needed)
  const handleReport = (prop: Property) => {
    setReportingProp(prop);
    Alert.alert(
      'Report Safety Concern',
      `Report "${prop.title}" for a safety issue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report', style: 'destructive', onPress: async () => {
            await trustService.reportSafety({ propertyId: prop.id, reason: 'Safety concern reported by user' });
            Alert.alert('Reported', 'Thank you. Our safety team will review this.');
          },
        },
      ]
    );
  };

  // Feature 3: accept conduct code from banner
  const handleAcceptConduct = async () => {
    await trustService.acceptConductCode();
    setConductAccepted(true);
  };

  // Feature 4: navigate to Trip Room with the winning property
  const openTripRoom = () => {
    if (!properties.length) return;
    const winner = properties.reduce((best, p) => p.keepVotes > best.keepVotes ? p : best, properties[0]);
    router.push({ pathname: '/trip-room', params: { city: currentCity, propId: winner.id } } as any);
  };

  // Feature 2: lookup map for ranked info (avoid re-iterating per card)
  const rankMap = useMemo(() => {
    const m: Record<string, RankedProperty> = {};
    rankedProperties.forEach(r => { m[r.id] = r; });
    return m;
  }, [rankedProperties]);

  // ─── Shared Comments Modal (used in both classic and retro themes) ────────────
  const commentsModal = (
    <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeModal}>
      <Animated.View style={{ flex: 1, backgroundColor: RETRO_THEME_ENABLED ? 'rgba(10,0,32,0.7)' : 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', opacity: modalOpacity }}>
        <Animated.View
          style={{
            backgroundColor: RETRO_THEME_ENABLED ? RETRO_COLORS.cardBg : '#F5F1E9',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 16,
            maxHeight: '70%',
            borderTopWidth: RETRO_THEME_ENABLED ? 2 : 0,
            borderLeftWidth: RETRO_THEME_ENABLED ? 2 : 0,
            borderRightWidth: RETRO_THEME_ENABLED ? 2 : 0,
            borderColor: RETRO_THEME_ENABLED ? RETRO_COLORS.neonMagenta : 'transparent',
            transform: [{ translateY: modalTranslate }],
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontWeight: '600', color: RETRO_THEME_ENABLED ? RETRO_COLORS.textPrimary : '#0F172A' }}>{selectedProp?.title}</Text>
            <Pressable onPress={closeModal}>
              <Ionicons name="close" size={22} color={RETRO_THEME_ENABLED ? RETRO_COLORS.neonCyan : '#0F172A'} />
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: 288 }}>
            {comments.length === 0 && (
              <Text style={{ color: RETRO_THEME_ENABLED ? RETRO_COLORS.textMuted : '#6B7280' }}>No comments yet. Be first!</Text>
            )}
            {comments.map((c) => (
              <View key={c.id} style={{ marginBottom: 8, padding: 8, backgroundColor: RETRO_THEME_ENABLED ? '#1A0040' : '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: RETRO_THEME_ENABLED ? RETRO_COLORS.neonPurple : '#F3F4F6' }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: RETRO_THEME_ENABLED ? RETRO_COLORS.neonCyan : '#0F172A' }}>
                  {c.author} <Text style={{ color: RETRO_THEME_ENABLED ? RETRO_COLORS.textMuted : '#9CA3AF' }}>· {c.timestamp}</Text>
                </Text>
                <Text style={{ fontSize: 13, marginTop: 2, color: RETRO_THEME_ENABLED ? RETRO_COLORS.textSecondary : '#374151' }}>{c.text}</Text>
              </View>
            ))}
          </ScrollView>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{ flexDirection: 'row', marginTop: 8, borderTopWidth: 1, borderTopColor: RETRO_THEME_ENABLED ? RETRO_COLORS.neonPurple : '#E5E7EB', paddingTop: 8 }}>
              <TextInput
                value={newCommentText}
                onChangeText={setNewCommentText}
                placeholder="Add a comment..."
                placeholderTextColor={RETRO_THEME_ENABLED ? RETRO_COLORS.textMuted : '#9CA3AF'}
                style={{ flex: 1, backgroundColor: RETRO_THEME_ENABLED ? '#1A0040' : '#FFFFFF', borderWidth: 1, borderColor: RETRO_THEME_ENABLED ? RETRO_COLORS.neonMagenta : '#D1D5DB', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, color: RETRO_THEME_ENABLED ? RETRO_COLORS.textPrimary : '#0F172A' }}
                onSubmitEditing={submitComment}
              />
              <Pressable onPress={submitComment} style={{ backgroundColor: RETRO_THEME_ENABLED ? RETRO_COLORS.neonMagenta : '#0284C8', paddingHorizontal: 16, borderRadius: 6, alignItems: 'center', justifyContent: 'center', ...RETRO_THEME_ENABLED ? RETRO_GLOW.magenta : {} }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Send</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );

  // ─── RETRO THEME RENDER ────────────────────────────────────────────────────
  if (RETRO_THEME_ENABLED) {
    const allCities = ['Coastal Demo', 'Chicago', 'New York', 'Atlanta'];

    return (
      <SynthwaveBackground sunUpperLeft>
        <View style={{ flex: 1 }}>

          {/* ── HEADER ROW ── hamburger | Lumina logo | bell */}
          <View style={{
            paddingTop: 48,
            paddingHorizontal: 16,
            paddingBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(10,0,32,0.75)',
          }}>
            {/* Hamburger in cyan neon rounded-square */}
            <Pressable
              onPress={() => router.push('/matching' as any)}
              style={{
                width: 40, height: 40,
                borderRadius: RETRO_SIZE.buttonBorderRadius,
                borderWidth: 2,
                borderColor: RETRO_COLORS.neonCyan,
                backgroundColor: 'rgba(0,255,255,0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                ...RETRO_GLOW.cyan,
              }}
            >
              <Ionicons name="menu" size={20} color={RETRO_COLORS.neonCyan} />
            </Pressable>

            {/* Lumina — italic glowing script-style logo */}
            <Text style={{
              fontSize: 30,
              fontWeight: '900',
              fontStyle: 'italic',
              color: RETRO_COLORS.neonPink,
              letterSpacing: 4,
              textShadowColor: RETRO_COLORS.neonPink,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 14,
            }}>
              Lumina
            </Text>

            {/* Bell in cyan neon rounded-square */}
            <Pressable
              style={{
                width: 40, height: 40,
                borderRadius: RETRO_SIZE.buttonBorderRadius,
                borderWidth: 2,
                borderColor: RETRO_COLORS.neonCyan,
                backgroundColor: 'rgba(0,255,255,0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                ...RETRO_GLOW.cyan,
              }}
            >
              <Ionicons name="notifications-outline" size={20} color={RETRO_COLORS.neonCyan} />
            </Pressable>
          </View>

          {/* ── TITLE PANEL ── neon-bordered rounded rect */}
          <View style={{
            marginHorizontal: 12,
            marginTop: 10,
            borderWidth: 2,
            borderColor: RETRO_COLORS.neonYellow,
            borderRadius: RETRO_SIZE.cardBorderRadius,
            backgroundColor: 'rgba(10,0,32,0.82)',
            paddingHorizontal: 14,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            ...RETRO_GLOW.orange,
          }}>
            {/* Left: title + subtitle */}
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={{
                color: RETRO_COLORS.neonYellow,
                fontSize: 11,
                fontWeight: '900',
                letterSpacing: 1.5,
                textShadowColor: RETRO_COLORS.neonYellow,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 8,
              }}>
                PROPERTY SELECTION — DAY {round?.currentDay || 2} OF {round?.totalDays || 3}
              </Text>
              <Text style={{ color: RETRO_COLORS.neonCyan, fontSize: 10, marginTop: 3, letterSpacing: 0.5 }}>
                Help the group pick our perfect stay!
              </Text>
              {/* Live group vote progress */}
              {groupVotingStatus && (
                <View style={{ marginTop: 5, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ flex: 1, height: 2, backgroundColor: 'rgba(255,0,255,0.2)', borderRadius: 1, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${(groupVotingStatus.votedCount / groupVotingStatus.totalMembers) * 100}%`, backgroundColor: RETRO_COLORS.neonMagenta }} />
                  </View>
                  <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 8, letterSpacing: 0.5 }}>{groupVotingStatus.votedCount}/{groupVotingStatus.totalMembers} VOTED</Text>
                </View>
              )}
            </View>

            {/* Right: TIME REMAINING mini-box */}
            <View style={{
              borderWidth: 1.5,
              borderColor: RETRO_COLORS.neonCyan,
              borderRadius: 8,
              backgroundColor: 'rgba(0,255,255,0.06)',
              paddingHorizontal: 10,
              paddingVertical: 6,
              alignItems: 'center',
              minWidth: 88,
              ...RETRO_GLOW.cyan,
            }}>
              <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 7, fontWeight: '700', letterSpacing: 1.5, marginBottom: 2 }}>
                TIME REMAINING
              </Text>
              <Text style={{
                color: RETRO_COLORS.neonCyan,
                fontSize: 14,
                fontWeight: '900',
                letterSpacing: 1,
                fontVariant: ['tabular-nums'] as any,
                textShadowColor: RETRO_COLORS.neonCyan,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 6,
              }}>
                {formatMockupCountdown(displayCountdown)}
              </Text>
            </View>
          </View>

          {/* ── SCROLLABLE CONTENT ── */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 90 }}>

            {/* Conduct gate */}
            {!conductAccepted && (
              <View style={{ marginHorizontal: 12, marginTop: 10, backgroundColor: 'rgba(255,165,0,0.1)', borderWidth: 1.5, borderColor: '#FFA500', borderRadius: 10, padding: 12 }}>
                <Text style={{ color: '#FFA500', fontWeight: '700', letterSpacing: 1 }}>CODE OF CONDUCT REQUIRED</Text>
                <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 11, marginTop: 4 }}>Review and accept our Code of Conduct to participate in group voting.</Text>
                <Pressable onPress={handleAcceptConduct} style={{ marginTop: 8, backgroundColor: '#FFA500', paddingVertical: 8, borderRadius: 6, alignItems: 'center' }}>
                  <Text style={{ color: '#000', fontWeight: '700' }}>ACCEPT &amp; CONTINUE ✓</Text>
                </Pressable>
              </View>
            )}

            {/* City selector — horizontal neon chips */}
            <View style={{ marginTop: 10, paddingHorizontal: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 8, letterSpacing: 2 }}>DESTINATION</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 8 }}>BUDGET: ${groupBudget}/pp</Text>
                  <Pressable onPress={() => setGroupBudget(b => Math.max(50, b - 10))} style={{ paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3, borderWidth: 1, borderColor: RETRO_COLORS.neonPurple }}>
                    <Text style={{ color: RETRO_COLORS.neonPurple, fontWeight: '700', fontSize: 9 }}>−</Text>
                  </Pressable>
                  <Pressable onPress={() => setGroupBudget(b => b + 10)} style={{ paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3, borderWidth: 1, borderColor: RETRO_COLORS.neonPurple }}>
                    <Text style={{ color: RETRO_COLORS.neonPurple, fontWeight: '700', fontSize: 9 }}>+</Text>
                  </Pressable>
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                <View style={{ flexDirection: 'row', gap: 8, paddingRight: 4 }}>
                  {allCities.map((city) => (
                    <Pressable
                      key={city}
                      onPress={async () => {
                        await propertyService.setCurrentCity(city);
                        setCurrentCity(city);
                        const p = await propertyService.getProperties();
                        setProperties(p);
                        setViewMode('vote');
                        setEliminatedIds(new Set());
                        setResultsSummary(null);
                      }}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        borderWidth: 1.5,
                        borderColor: currentCity === city ? RETRO_COLORS.neonCyan : RETRO_COLORS.neonPurple,
                        backgroundColor: currentCity === city ? 'rgba(0,255,255,0.14)' : 'rgba(155,48,255,0.06)',
                        ...(currentCity === city ? RETRO_GLOW.cyan : {}),
                      }}
                    >
                      <Text style={{
                        fontWeight: '700',
                        fontSize: 10,
                        letterSpacing: 0.5,
                        color: currentCity === city ? RETRO_COLORS.neonCyan : RETRO_COLORS.textSecondary,
                      }}>
                        {city === 'Coastal Demo' ? 'DEMO' : city.toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Avatars + group info */}
            <View style={{ paddingHorizontal: 12, marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
              {displayedAvatars.map((m, i) => (
                <Image
                  key={i}
                  source={{ uri: m.avatarUrl }}
                  style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: RETRO_COLORS.neonCyan, marginLeft: i === 0 ? 0 : -7, zIndex: 10 - i }}
                />
              ))}
              <View style={{ marginLeft: 6, backgroundColor: 'rgba(0,255,255,0.12)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10, borderWidth: 1, borderColor: RETRO_COLORS.neonCyan }}>
                <Text style={{ color: RETRO_COLORS.neonCyan, fontSize: 8, fontWeight: '700' }}>+{extraCount}</Text>
              </View>
              <Text style={{ marginLeft: 8, color: RETRO_COLORS.textMuted, fontSize: 9, letterSpacing: 0.3 }}>CHOOSING TOGETHER · {userVoteCount}/2 VOTES</Text>
              <Pressable
                onPress={() => Alert.alert('How voting works', 'Each member gets exactly 2 votes per round.\n\n• Tap KEEP or ELIMINATE on up to 2 properties.\n• Tap the same button again to change your vote.\n• Tap any property card to open discussion.\n• "VIEW RESULTS" shows the group standings.\n• After results, "OPEN TRIP ROOM" locks in the winner.', [{ text: 'Got it' }])}
                style={{ marginLeft: 4 }}
              >
                <Ionicons name="information-circle-outline" size={12} color={RETRO_COLORS.neonPurple} />
              </Pressable>
            </View>

            {/* ── TWO-COLUMN PROPERTY GRID ── */}
            <Animated.View style={[{ paddingHorizontal: 10, paddingTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, gridAnimStyle]}>
              {properties.map((p) => (
                <View key={p.id} style={{ width: '47.5%' }}>
                  <NeonPropertyCard
                    property={p}
                    isEliminated={eliminatedIds.has(p.id)}
                    showResultsOverlay={viewMode === 'results'}
                    isOverBudget={!!rankMap[p.id]?.isOverBudget}
                    isTopPick={rankMap[p.id]?.recommendation === 'top-pick'}
                    onVote={handleVote}
                    onFavorite={handleToggleFavorite}
                    onOpenComments={openComments}
                    onReport={handleReport}
                    heartAnimStyle={heartAnimStyle}
                    compact
                  />
                </View>
              ))}
            </Animated.View>

            {/* Bottom action buttons */}
            <View style={{ paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8 }}>
              {viewMode === 'vote' ? (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable
                    onPress={computeResults}
                    style={{ flex: 1, backgroundColor: 'rgba(255,0,255,0.12)', paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 2, borderColor: RETRO_COLORS.neonMagenta, ...RETRO_GLOW.magenta }}
                  >
                    <Text style={{ color: RETRO_COLORS.neonMagenta, fontWeight: '900', letterSpacing: 2, fontSize: 11 }}>VIEW RESULTS</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleAdvanceRound}
                    style={{ paddingHorizontal: 14, paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 2, borderColor: RETRO_COLORS.neonPurple, backgroundColor: 'rgba(155,48,255,0.1)' }}
                  >
                    <Text style={{ color: RETRO_COLORS.neonPurple, fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>NEXT DAY</Text>
                  </Pressable>
                </View>
              ) : (
                <View>
                  <Pressable
                    onPress={() => { setViewMode('vote'); setEliminatedIds(new Set()); setResultsSummary(null); }}
                    style={{ backgroundColor: 'rgba(0,255,255,0.12)', paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 2, borderColor: RETRO_COLORS.neonCyan, ...RETRO_GLOW.cyan }}
                  >
                    <Text style={{ color: RETRO_COLORS.neonCyan, fontWeight: '900', letterSpacing: 2, fontSize: 11 }}>BACK TO VOTING</Text>
                  </Pressable>
                  <Pressable
                    onPress={openTripRoom}
                    style={{ marginTop: 8, backgroundColor: 'rgba(255,107,53,0.2)', paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 2, borderColor: RETRO_COLORS.neonOrange, ...RETRO_GLOW.orange }}
                  >
                    <Text style={{ color: RETRO_COLORS.neonOrange, fontWeight: '900', letterSpacing: 2, fontSize: 11 }}>OPEN TRIP ROOM 🏠</Text>
                  </Pressable>
                </View>
              )}
              {resultsSummary && (
                <Text style={{ marginTop: 8, textAlign: 'center', color: RETRO_COLORS.textMuted, fontSize: 9, letterSpacing: 0.5 }}>{resultsSummary}</Text>
              )}
            </View>
          </ScrollView>

          {/* ── BOTTOM NEON NAV BAR (visual mockup style — labels mirror mockup, real nav unchanged) ── */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: 'rgba(10,0,32,0.96)',
            borderTopWidth: 2,
            borderTopColor: RETRO_COLORS.neonMagenta,
            paddingVertical: 6,
            paddingBottom: 20,
          }}>
            {([
              { label: 'Properties', icon: 'home', active: true },
              { label: 'Group', icon: 'people-outline', active: false },
              { label: 'Votes', icon: 'stats-chart-outline', active: false },
              { label: 'Profile', icon: 'person-outline', active: false },
            ] as const).map((item) => (
              <Pressable key={item.label} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={item.active ? RETRO_COLORS.neonMagenta : RETRO_COLORS.textMuted}
                />
                <Text style={{
                  color: item.active ? RETRO_COLORS.neonMagenta : RETRO_COLORS.textMuted,
                  fontSize: 9,
                  fontWeight: '700',
                  letterSpacing: 0.5,
                  marginTop: 2,
                  textShadowColor: item.active ? RETRO_COLORS.neonMagenta : 'transparent',
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: item.active ? 6 : 0,
                }}>
                  {item.label.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>

        </View>

        {commentsModal}
      </SynthwaveBackground>
    );
  }

  // ─── CLASSIC THEME RENDER (fallback, fully preserved) ─────────────────────
  return (
    <View className="flex-1 bg-retro-cream">
      {/* Header */}
      <View className="pt-12 px-4 pb-3 bg-retro-cream border-b-2 border-black">
        <View className="flex-row items-center">
          <Text className="text-3xl font-extrabold tracking-tight text-retro-ink">Lumina</Text>
          <Text className="text-retro-amber text-2xl ml-1 -mt-1">✦</Text>
        </View>
        <Text className="text-retro-dark -mt-1">Curated small-group travel for platonic friendships.</Text>

        {/* Status banner */}
        <View className="mt-3 bg-retro-paper border-2 border-black shadow-retro-sm rounded-xl p-3 flex-row items-center">
          <Ionicons name="game-controller" size={18} color="#0284C8" />
          <Text className="ml-2 text-sm font-bold text-retro-ink flex-1">Game • Collaborative voting • 2 votes per person</Text>
          <Pressable onPress={() => router.push('/matching' as any)}>
            <Text className="text-retro-blue text-xs font-bold">Queue</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Feature 3: Conduct gate banner */}
        {!conductAccepted && (
          <View className="mx-4 mt-3 bg-amber-100 border-2 border-black shadow-retro-sm rounded-xl p-3">
            <Text className="text-sm font-extrabold text-retro-ink">Code of Conduct Required</Text>
            <Text className="text-xs text-retro-dark mt-0.5">Review and accept our Code of Conduct to participate in group voting.</Text>
            <Pressable onPress={handleAcceptConduct} className="mt-2 bg-retro-ink border-2 border-black py-2 rounded-lg items-center">
              <Text className="text-white text-sm font-bold">Accept &amp; Continue ✓</Text>
            </Pressable>
          </View>
        )}

        {/* City selector */}
        <View className="px-4 pt-3">
          <Text className="text-xs uppercase tracking-widest text-retro-dark mb-1.5">DESTINATION</Text>
          <View className="flex-row gap-2">
            {['Chicago', 'New York', 'Atlanta'].map((city) => (
              <Pressable
                key={city}
                onPress={async () => {
                  await propertyService.setCurrentCity(city);
                  setCurrentCity(city);
                  const p = await propertyService.getProperties();
                  setProperties(p);
                  setViewMode('vote');
                  setEliminatedIds(new Set());
                  setResultsSummary(null);
                }}
                className={`flex-1 py-2 rounded-full border-2 border-black items-center ${currentCity === city ? 'bg-retro-blue shadow-retro-sm' : 'bg-retro-paper'}`}
              >
                <Text className={`font-bold text-sm ${currentCity === city ? 'text-white' : 'text-retro-ink'}`}>{city}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Feature 2: Budget guardrail control */}
        <View className="px-4 mt-2 flex-row items-center justify-between">
          <Text className="text-xs text-retro-dark">Budget cap: ${groupBudget}/person/night</Text>
          <View className="flex-row gap-2">
            <Pressable onPress={() => setGroupBudget(b => Math.max(50, b - 10))} className="bg-retro-paper px-2.5 py-0.5 rounded-md border-2 border-black">
              <Text className="text-sm font-bold text-retro-ink">−</Text>
            </Pressable>
            <Pressable onPress={() => setGroupBudget(b => b + 10)} className="bg-retro-paper px-2.5 py-0.5 rounded-md border-2 border-black">
              <Text className="text-sm font-bold text-retro-ink">+</Text>
            </Pressable>
          </View>
        </View>

        {/* Round header + countdown + avatars */}
        <View className="px-4 mt-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-extrabold text-retro-ink">{currentCity} homes</Text>
              <Text className="text-retro-dark text-xs">Round {round?.currentDay || 2} of {round?.totalDays || 3}</Text>
            </View>
            <View className="items-end">
              <Text className="text-xs text-retro-dark">Voting ends in</Text>
              <Text className="font-mono text-base font-semibold text-retro-blue">{displayCountdown}</Text>
            </View>
          </View>

          {/* Avatars +N */}
          <View className="flex-row items-center mt-2">
            {displayedAvatars.map((m, i) => (
              <Image key={i} source={{ uri: m.avatarUrl }} className="w-8 h-8 rounded-full border-2 border-black -ml-2" style={{ zIndex: 10 - i }} />
            ))}
            <View className="ml-1 bg-retro-blue px-2 py-0.5 rounded-full border-2 border-black">
              <Text className="text-white text-[10px] font-semibold">+{extraCount}</Text>
            </View>
            <Text className="ml-2 text-xs text-retro-dark">5 men + 5 women choosing together</Text>
          </View>

          {/* Feature 1: Live voting progress bar */}
          {groupVotingStatus && (
            <View className="mt-1.5 flex-row items-center gap-2">
              <View className="flex-1 h-2 bg-white border border-black rounded-full overflow-hidden">
                <View
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(groupVotingStatus.votedCount / groupVotingStatus.totalMembers) * 100}%` }}
                />
              </View>
              <Text className="text-[11px] text-retro-dark">{groupVotingStatus.votedCount}/{groupVotingStatus.totalMembers} voted</Text>
            </View>
          )}

          <View className="mt-1 flex-row items-center">
            <Text className="text-[11px] text-retro-dark">Everyone has 2 votes • {userVoteCount}/2 used</Text>
            <Pressable
              onPress={() =>
                Alert.alert(
                  'How voting works',
                  'Each member gets exactly 2 votes per round.\n\n• Tap Keep (👍) or Eliminate (👎) on up to 2 properties.\n• Tap the same button again to change your vote.\n• Tap any property card to open discussion.\n• "View Results" shows the group standings.\n• After results, "Open Trip Room" locks in the winner.',
                  [{ text: 'Got it' }]
                )
              }
              className="ml-2"
            >
              <Ionicons name="information-circle-outline" size={14} color="#64748B" />
            </Pressable>
          </View>
        </View>

        {/* Properties grid */}
        <View className="px-4 pt-4">
          <Animated.View style={gridAnimStyle}>
          {properties.map((p) => {
            const isElim = eliminatedIds.has(p.id);
            return (
              <Pressable
                key={p.id}
                onPress={() => openComments(p)}
                className={`mb-4 bg-retro-paper border-2 border-black shadow-retro rounded-2xl overflow-hidden ${isElim ? 'opacity-50' : ''}`}
              >
                <View className="relative">
                  <Image source={{ uri: p.imageUrl }} className="w-full h-44" />
                  <View className="absolute top-3 left-3 bg-white/90 border border-black px-2 py-0.5 rounded">
                    <Text className="text-xs font-semibold">${p.pricePerPerson} / person</Text>
                  </View>
                  <Pressable
                    onPress={() => handleToggleFavorite(p.id)}
                    className="absolute top-3 right-3 bg-white/90 border border-black p-1.5 rounded-full"
                  >
                    <Animated.View style={heartAnimStyle}>
                      <Ionicons name={p.isFavorited ? 'heart' : 'heart-outline'} size={16} color={p.isFavorited ? '#e11d48' : '#64748B'} />
                    </Animated.View>
                  </Pressable>
                  {viewMode === 'results' && isElim && (
                    <View className="absolute inset-0 bg-black/60 items-center justify-center">
                      <Text className="text-white font-bold tracking-widest">ELIMINATED</Text>
                    </View>
                  )}
                </View>

                <View className="p-3">
                  <Text className="font-semibold text-base text-[#0F172A]">{p.title}</Text>
                  <Text className="text-xs text-retro-dark">{p.location.city}, {p.location.country}</Text>
                  {/* Feature 2: recommendation badges */}
                  {rankMap[p.id]?.recommendation === 'top-pick' && (
                    <Text className="text-[11px] text-amber-600 font-medium mt-0.5">🏆 Group's top pick</Text>
                  )}
                  {rankMap[p.id]?.isOverBudget && (
                    <Text className="text-[11px] text-rose-600 font-medium mt-0.5">⚠️ Over ${groupBudget}/night budget</Text>
                  )}

                  <View className="mt-2 flex-row items-center justify-between">
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => handleVote(p.id, 'keep')}
                        className={`flex-row items-center px-3 py-1 rounded-full border-2 border-black ${p.myVote === 'keep' ? 'bg-emerald-200' : 'bg-white'}`}
                      >
                        <Ionicons name="thumbs-up" size={14} color={p.myVote === 'keep' ? '#059669' : '#64748B'} />
                        <Text className={`ml-1 text-xs font-medium ${p.myVote === 'keep' ? 'text-emerald-700' : 'text-gray-600'}`}>Keep • {p.keepVotes}</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleVote(p.id, 'eliminate')}
                        className={`flex-row items-center px-3 py-1 rounded-full border-2 border-black ${p.myVote === 'eliminate' ? 'bg-rose-200' : 'bg-white'}`}
                      >
                        <Ionicons name="thumbs-down" size={14} color={p.myVote === 'eliminate' ? '#e11d48' : '#64748B'} />
                        <Text className={`ml-1 text-xs font-medium ${p.myVote === 'eliminate' ? 'text-rose-700' : 'text-gray-600'}`}>Elim • {p.eliminateVotes}</Text>
                      </Pressable>
                    </View>

                    <View className="flex-row items-center gap-2">
                      <Pressable onPress={() => openComments(p)} className="flex-row items-center">
                        <Ionicons name="chatbubble-outline" size={14} color="#64748B" />
                        <Text className="ml-1 text-xs text-retro-dark">{p.commentCount}</Text>
                      </Pressable>
                      {/* Feature 3: report button */}
                      <Pressable onPress={() => handleReport(p)}>
                        <Ionicons name="flag-outline" size={14} color="#8A7A6E" />
                      </Pressable>
                    </View>
                  </View>

                  {p.myVote && <View className="mt-1 h-0.5 bg-retro-blue w-8" />}
                </View>
              </Pressable>
            );
          })}
          </Animated.View>
        </View>

        {/* Bottom actions */}
        <View className="px-4 pb-8">
          {viewMode === 'vote' ? (
            <View className="flex-row gap-3">
              <Pressable onPress={computeResults} className="flex-1 bg-retro-ink py-3 rounded-xl border-2 border-black shadow-retro-sm items-center">
                <Text className="text-white font-bold">View Results</Text>
              </Pressable>
              <Pressable onPress={handleAdvanceRound} className="px-4 py-3 rounded-xl bg-retro-paper border-2 border-black items-center justify-center">
                <Text className="text-xs font-bold text-retro-ink">Advance Day</Text>
              </Pressable>
            </View>
          ) : (
            <View>
              <Pressable onPress={() => { setViewMode('vote'); setEliminatedIds(new Set()); setResultsSummary(null); }} className="bg-retro-blue py-3 rounded-xl border-2 border-black shadow-retro-sm items-center">
                <Text className="text-white font-bold">Back to Voting</Text>
              </Pressable>
              {/* Feature 4: Trip Room — opens once group converges on a winner */}
              <Pressable onPress={openTripRoom} className="mt-2 bg-retro-amber py-3 rounded-xl border-2 border-black shadow-retro-sm items-center">
                <Text className="text-retro-ink font-bold">Open Trip Room 🏠</Text>
              </Pressable>
            </View>
          )}
          {resultsSummary && <Text className="mt-2 text-center text-xs text-retro-dark">{resultsSummary}</Text>}
        </View>
      </ScrollView>

      {commentsModal}
    </View>
  );
}
